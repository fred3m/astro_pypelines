# fitsviewer.py
# Server side of fits viewer client in browser
# Copyright 2014 by Fred Moolekamp
# License: GPLv3

from __future__ import division,print_function
from random import *
import os
import math
import astropy.io.fits as pyfits
import numpy as np
import copy
import astropy.wcs as pywcs
import hashlib

# astropyp modules
import astropyp.utils.core as core
from ...utils import tools
from ..photometry import detect_sources
from ..photometry import catalog
from .fits_core import *

def getTempPath(id,tile):
    try:
        #hash_dir=hashlib.md5(id['userId']+id['sessionId']+tile['fileId']+str(tile['frame'])).hexdigest()
        hash_dir=hashlib.md5(tile['fileId']+str(tile['frame'])).hexdigest()
    except KeyError:
        raise core.AstropypError("Missing parameters to generate path for temp directory")
    tempPath=os.path.join(core.active_users[id['userId']].stored_dirs['session'][id['sessionId']],hash_dir)
    return os.path.relpath(tempPath,core.ROOT_DIR)

def checkTempPath(id,params):
    path=getTempPath(id,params)
    fullpath=os.path.join(core.ROOT_DIR,path)
    try:
        os.makedirs(fullpath)
    except OSError:
        if not os.path.isdir(fullpath):
            raise core.AstropypError("Could not access temp directory")
    return [path,fullpath]

def getImageProperties(hdu):
    """
    getImageProperties
    
    Get important properties of a fits hdu. Many of the properties are loaded from the header but a number of them
    are also derived.
    
    Parameters
    ----------
    hdu: astropy.io.fits.IMAGEHDU
        -Frame of the fits file that data is extracted from
    
    Returns
    -------
    hdu.properties: dictionary
        - The function will generate the properties of an hdu and save them in the attribute hdu.properties, which is
        also returned by the function
    """
    try:
        return hdu.properties
    except AttributeError:
        try:
            hdu.properties={
                'width':hdu.header['NAXIS1'],
                'height':hdu.header['NAXIS2']
            }
        except KeyError:
            raise core.AstropypError("Tried to load image properties for non-image hdu")
        try:
            xyRanges=[map(int,coordRange.split(':')) for coordRange in hdu.header['DETSEC'][1:-1].split(',')]
        except KeyError:
            xyRanges=[[1,hdu.properties['width']],[1,hdu.properties['height']]]
        hdu.properties['minCoords']=[xyRanges[0][0],xyRanges[1][0]]
        hdu.properties['maxCoords']=[xyRanges[0][1],xyRanges[1][1]]
        hdu.properties['dataMin']=float(np.amin(hdu.data))
        hdu.properties['dataMax']=float(np.amax(hdu.data))
        try:
            hdu.wcs=pywcs.WCS(hdu.header)
            # Call a function that will fail if wcs was not loaded properly
            # TODO: The error given is InconsistentAxisTypesError, but 
            # the documentation doesn't list the module that error is contained in
            # FOr completeness the exact error should be trapped
            temp=hdu.wcs.get_axis_types()
            hdu.properties['wcsAvailable']=True
        except:
            print("WCS not available")
            hdu.properties['wcsAvailable']=False
        return hdu.properties

def getWindow(viewer):
    """
    getWindow
    
    To save space and ensure that zooming in and out of an image is always centered on the same location, only
    the center coordinates (xCenter,yCenter) are stored for a fits viewer window. This function calculates the
    upper left and lower right coordinates of a fitsviewer window based on the canvas size and scale of the image.
    
    Parameters
    ----------
    viewer: dictionary
        - Dictionary of fitsviewer properties. Required keys:
            xCenter, yCenter: int
                - x and y coordinates at the center of the image
            canvasWidth,canvasHeight: int
                - Width and height of the client canvas displaying the fits image
            scale: float
                - Scale of the image (scale=1 has 1 pixel for each element of the image array)
    
    Returns
    -------
    viewer: dictionary
        - The same viewer sent to the function is returned with its upper left boundary (x0,y0) and lower right boundary
        (xf,yf) calculated
    """
    viewer['x0']=int(viewer['xCenter']-viewer['canvasWidth']/viewer['scale']/2)
    viewer['y0']=int(viewer['yCenter']-viewer['canvasHeight']/viewer['scale']/2)
    viewer['xf']=int(viewer['x0']+viewer['canvasWidth']/viewer['scale'])
    viewer['yf']=int(viewer['y0']+viewer['canvasHeight']/viewer['scale'])
    return viewer

def getBestFit(hdu,viewer):
    """
    getBestFit
    
    Calculate the scale and viewer boundaries needed to fit an entire FITS image in the clients canvas viewer.
    
    Parameters
    ----------
    hdu: pyfits image hdu
        - The image hdu (FITS frame that contains the image data)
    viewer: dictionary
        - Dictionary of fitsviewer properties. Required keys:
            xCenter, yCenter: int
                - x and y coordinates at the center of the image
            canvasWidth,canvasHeight: int
                - Width and height of the client canvas displaying the fits image
            scale: float
                - Scale of the image (scale=1 has 1 pixel for each element of the image array)
    
    Returns
    -------
    viewer: dictionary
        - The same viewer sent to the function is returned with its upper left boundary (x0,y0) and lower right boundary
        (xf,yf) calculated
    """
    xScale=viewer['canvasWidth']/hdu.properties['width']
    yScale=viewer['canvasHeight']/hdu.properties['height']
    scale=yScale;
    if xScale<yScale:
        scale=xScale
    viewer['xCenter']=hdu.properties['width']/2
    viewer['yCenter']=hdu.properties['height']/2
    viewer['scale']=scale
    viewer=getWindow(viewer)
    return viewer

def getMosaicWindow(viewer,minCoords):
    """
    getMosaicWindow
    
    Mosaic images should contain fields in the header that give the coordinates of the lower left-hand corner of the image.
    This function uses those coordinates to calculate the position of the window so that the viewer is properly centered
    on the image.
    
    Parameters
    ----------
    viewer: dictionary
        - Dictionary of fitsviewer properties. Required keys:
            xCenter, yCenter: int
                - x and y coordinates at the center of the image
            canvasWidth,canvasHeight: int
                - Width and height of the client canvas displaying the fits image
            scale: float
                - Scale of the image (scale=1 has 1 pixel for each element of the image array)
    
    minCoords: list
        - x,y coordinates of the physical coordinates of the image.
    
    Returns
    -------
    viewer: dictionary
        - The same viewer sent to the function is returned with its upper left boundary (x0,y0) and lower right boundary
        (xf,yf) calculated
    """
    viewer['xCenter']=viewer['xCenter']-minCoords[0]
    viewer['xCenter']=viewer['xCenter']-minCoords[0]
    return viewer

def loadFitsFile(id,params):
    """
    loadFitsFile
    
    Load a fits file on the server. The function first checks to see if the file has already been loaded into memory,
    if it hasn't it uses astropy.io.fits (pyfits) to load the file into memory. It then sends a response to the client
    that contains the properties of the fits file along with the number of image frames contained in the file.
    
    Parameters
    ----------
    id: dictionary
        - dictionary that contains the following keys:
            userId: string
                - Unique identifier of the current user
            sessionId: string
                -Unique identifier of the current session
            requestId: string
                -Unique identifier for the current request sent by the client
    params: dictionary
        - Must contain either 'fileId' key or 'path' and 'filename' keys used to open the fits file
    
    Returns
    -------
    response: dictionary
        - The response is always a dictionary that contains an id field (in this case 'fits file') that identifies
        the type of response the client is receiving.
        
        - Other keys:
            properties: dictionary
                - Properties of the fits file. This includes all of the parameters sent to the function in params
                as well as any quantities calculated in the function
    """
    if 'fileId' not in params:
        params['fileId']=getFileId(params)
    try:
        hdulist=openFits[params['fileId']]
    except KeyError:
        hdulist=pyfits.open(os.path.join(params['path'],params['filename']))
        properties=params
        properties['imageHDUlist']=[]
        for n,hdu in enumerate(hdulist):
            if (isinstance(hdu, pyfits.hdu.image.ImageHDU) or 
                    isinstance(hdu, pyfits.hdu.compressed.CompImageHDU) or
                    len(hdulist)==1):
                properties['imageHDUlist'].append(n)
        properties['frames']=len(properties['imageHDUlist'])
        hdulist.properties=properties
        openFits[params['fileId']]=hdulist
    response={
        'id':"fits file",
        'properties':hdulist.properties
    }
    print('new fits file:',response)
    return response

def loadMosaic(id,params):
    """
    loadMosaic
    
    Loads mosaic information, open image hdu's, calculates the properties for each image hdu, and sends each
    image to the client as a png file.
    
    Parameters
    ----------
    id: dictionary
        - dictionary that contains the following keys:
            userId: string
                - Unique identifier of the current user
            sessionId: string
                -Unique identifier of the current session
            requestId: string
                -Unique identifier for the current request sent by the client
    params: dictionary
        - Must contain either 'fileId' key or 'path' and 'filename' keys used to open the fits file
    
    Returns
    -------
    None
    """
    
    hdulist=getHDUlist(id,params)
    
    # We need to know the min and max values of the entire mosaic image so that each frame
    # uses the same color map
    if 'dataMin' not in hdulist.properties:
        hdulist.properties['dataMin']=float("inf")
        hdulist.properties['dataMax']=float("-inf")
        hdulist.properties['minCoords']=[float("inf"),float("inf")]
        hdulist.properties['maxCoords']=[float("-inf"),float("-inf")]
        for n in hdulist.properties['imageHDUlist']:
            core.progress_log("Loading properties for frame "+str(n), id);
            hdu=hdulist[n]
            getImageProperties(hdu)
            print("max min for frame",n,hdu.properties['minCoords'],hdu.properties['maxCoords'])
            if hdu.properties['dataMin']<hdulist.properties['dataMin']:
                hdulist.properties['dataMin']=hdu.properties['dataMin']
            if hdu.properties['dataMax']>hdulist.properties['dataMax']:
                hdulist.properties['dataMax']=hdu.properties['dataMax']
            if hdu.properties['minCoords']<hdulist.properties['minCoords']:
                hdulist.properties['minCoords']=hdu.properties['minCoords']
            if hdu.properties['maxCoords']>hdulist.properties['maxCoords']:
                hdulist.properties['maxCoords']=hdu.properties['maxCoords']
        hdulist.properties['width']=hdulist.properties['maxCoords'][0]-hdulist.properties['minCoords'][0]
        hdulist.properties['height']=hdulist.properties['maxCoords'][1]-hdulist.properties['minCoords'][1]
        core.respond(id, {
            'id':"update fits file",
            'properties':hdulist.properties
        })
    if 'scale' not in params:
        params=getBestFit(hdulist,params)
    elif params['scale']<0:
        params=getBestFit(hdulist,params)
    else:
        params=getWindow(params)
    core.progress_log("Loading images...", id);
    for n in hdulist.properties['imageHDUlist']:
        hdu=hdulist[n]
        minCoords=hdu.properties['minCoords']
        maxCoords=hdu.properties['maxCoords']
        # only load images that are within the boundaries of the fits viewer window
        if (minCoords[0]<params['xf'] and maxCoords[0]>params['x0'] and
            minCoords[1]<params['yf'] and maxCoords[1]>params['y0']
        ):
            params['frame']=n
            params['mosaic']=True
            print("Params:",params)
            core.respond(id, loadImageHDU(id,params))
        else:
            print("Skipped frame",n)
    return {}

def loadImageHDU(id,params):
    core.check4key(params,['fileId','frame','colormap','canvasWidth','canvasHeight'])
    hdulist=getHDUlist(id,params)
    try:
        hdu=hdulist[params['frame']]
    except KeyError:
        raise core.AstropypError("Frame not found in fits image")
    path,fullpath=checkTempPath(id,params)
    getImageProperties(hdu)
    if 'scale' not in params.keys() or params['scale']<0:
        params=getBestFit(hdu,params)
    elif params['scale']>1:
        params['scale']=math.floor(params['scale'])
    params.update(hdu.properties)
    params=getWindow(params)
    if 'tile_width' not in params.keys():
        params['tile_width']=DEFAULT_TILE_WIDTH
    if 'tile_height' not in params.keys():
        params['tile_height']=DEFAULT_TILE_HEIGHT
    if 'mosaic' not in params.keys():
        params['mosaic']=False
    params['columns']=math.ceil(hdu.properties['width']/params['tile_width']*params['scale'])
    params['rows']=math.ceil(hdu.properties['height']/params['tile_height']*params['scale'])
    core.respond(id, {
        'id':"image properties",
        'properties':params
    })

    if 'clear_dir' in params:
        for root,dirs,files in os.walk(fullpath):
            for file in files:
                os.remove(os.path.join(root,file))
            for dir in dirs:
                os.remove(root)
        params.pop('clear_dir')
    x0=params['x0']
    y0=params['y0']
    xf=params['xf']
    yf=params['yf']
    if params['mosaic']:
        x0=x0-hdu.properties['minCoords'][0]
        y0=y0-hdu.properties['minCoords'][1]
        xf=xf-hdu.properties['minCoords'][0]
        yf=yf-hdu.properties['minCoords'][1]
    minCol=int(max(0,math.floor(x0*params['scale']/params['tile_width'])))
    maxCol=int(min(params['columns'],math.ceil(xf*params['scale']/params['tile_width'])))
    minRow=int(max(0,math.floor(y0*params['scale']/params['tile_height'])))
    maxRow=int(min(params['rows'],math.ceil(yf*params['scale']/params['tile_height'])))
    for row in range(minRow,maxRow):
        for col in range(minCol,maxCol):
            params['x']=int(col*params['tile_width']/params['scale'])
            params['y']=int(row*params['tile_height']/params['scale'])
            if params['x']<hdu.properties['width'] and params['y']<hdu.properties['height']:
                params['filetype']='png'
                core.respond(id, loadTile(id,params))
    return {}

def loadTile(id,params):
    import astro_pypelines
    core.check4key(params,['frame','x','y','tile_width','tile_height','scale','colormap','filetype'])
    hdulist=getHDUlist(id,params)
    try:
        hdu=hdulist[params['frame']]
    except KeyError:
        raise core.AstropypError("Frame not found in fits image")
    if not hasattr(hdu,'properties'):
        getImageProperties(hdu)
    tileData=[]
    tile=copy.deepcopy(params)
    tile.update({
        'id':"tilepng",
        'tileId':getTileId(params)
    })
    path,fullpath=checkTempPath(id,params)
    pngName=os.path.join(path,tile['tileId']+".png")
    filename=os.path.join(core.ROOT_DIR,pngName)
    tile['pngName']=pngName
    if (
        params['x']<0 or params['y']<0 or 
        params['x']>hdu.properties['width'] or params['y']>hdu.properties['height']
    ):
        raise core.AstropypError("Tile at ("+str(params['x'])+","+str(params['y'])+") is not located in the image")
    xmin=params['x']
    ymin=params['y']
    if params['scale']>1:
        params['scale']=math.floor(params['scale'])
    tile['tile_width']=min(int((hdu.properties['width']-xmin-1)*params['scale']),params['tile_width'])
    tile['tile_height']=min(int((hdu.properties['height']-ymin-1)*params['scale']),params['tile_height'])
    if tile['tile_width']<=0 or tile['tile_height']<=0:
        return {}
    xmax=int(xmin+tile['tile_width']/params['scale'])
    ymax=int(ymin+tile['tile_height']/params['scale'])
    tile['x']=xmin
    tile['y']=ymin
    tile['minCoords']=hdu.properties['minCoords']
    tile['maxCoords']=hdu.properties['maxCoords']
    if not os.path.isfile(filename):
        if params['scale']==1:
            tileDataArray=hdu.data[ymin:ymax,xmin:xmax]
            tileData=tileDataArray.tolist()
        elif params['scale']>1:
            tileDataArray=hdu.data[ymin:ymax,xmin:xmax]
            tileDataArray=np.kron(tileDataArray,np.ones((params['scale'],params['scale'])))
            tileData=tileDataArray.tolist()
        elif params['scale']<1 and params['scale']>0:
            xIdx=np.linspace(xmin,xmax,tile['tile_width'])
            yIdx=np.linspace(ymin,ymax,tile['tile_height'])
            xIdx=np.array(xIdx,np.int)
            yIdx=np.reshape(np.array(yIdx,np.int),(yIdx.size,1))
            tileDataArray=hdu.data[yIdx,xIdx]
            tileData=tileDataArray.tolist()
        else:
            raise core.AstropypError("Invalid scale sent to server")
        if len(tileData)>0:
            if params['filetype']=='png':
                #tile['colormap']['colorFunc']="GRAY"
                import astro_pypelines.pypelines.fitsviewer.png
                if not astro_pypelines.pypelines.fitsviewer.png.buildImageTileC(filename,tile['colormap']['dataMin'],tile['colormap']['dataMax'],
                                tile['colormap']['scale'],tile['colormap']['colorFunc'],tileData):
                    raise core.AstropypError("Unable to load tile")
            elif params['filetype']=='pixels':
                tile['y']=int(tile['y']+tile['tile_height']/params['scale'])
                tile['data']=[map(int,row) for row in tileData]
                tile['id']='image data'
                tile['dataType']=params['dataType']
                return tile
            else:
                raise core.AstropypError("Unrecognized filetype")
        else:
            raise core.AstropypError("Empty dataset sent to server")
    tile['y']=int(tile['y']+tile['tile_height']/params['scale'])
    if params['mosaic']:
        tile['x']=int(tile['x']+tile['minCoords'][0])
        tile['y']=int(tile['y']+tile['minCoords'][1])
    return tile

def loadHeader(id,params):
    core.check4key(params,['frame','fileId'])
    hdulist=getHDUlist(id,params)
    try:
        header=hdulist[params['frame']].header
    except KeyError:
        raise core.AstropypError("Frame not found in fits file")
    headerList=[]
    for key in header.keys():
        headerList.append([key,str(header[key]),header.comments[key]])
    response={
        'id':"fitsHeader",
        'fileId':params['fileId'],
        'frame':params['frame'],
        'header':headerList
        }
    return response
    
def loadDatapoint(id,params):
    core.check4key(params,['frame','fileId','x','y'])
    hdulist=getHDUlist(id,params)
    hdu=hdulist[params['frame']]
    ra="pywcs must be installed"
    dec="on server to activate wcs"
    if hdu.properties['wcsAvailable']:
        wcsArray=hdu.wcs.all_pix2world(np.array([[params['x'],params['y']]],np.float_),1)
        ra=str(wcsArray[0][0])
        dec=str(wcsArray[0][1])
    try:
        response={
            'id':"dataPoint",
            'dataPoint':str(hdu.data[params['y']][params['x']]),
            'ra':ra,
            'dec':dec
        }
    except KeyError as error:
        response={}
    return response

def load2dGaussFit(id,params):
    core.check4key(params,['fileId','frame','x','y','tile_width','tile_height'])
    hdulist=getHDUlist(id,params)
    try:
        hdu=hdulist[params['frame']]
    except KeyError:
        raise core.AstropypError("Frame not found in fits image")
    xmin=params['x']
    ymin=params['y']
    xmax=min(int(hdu.properties['width']),xmin+params['tile_width'])
    ymax=min(int(hdu.properties['height']),ymin+params['tile_height'])
    data=hdu.data[ymin:ymax,xmin:xmax]

    # Center the tile on the pixel with the highest value
    yIndex,xIndex=np.unravel_index(data.argmax(),data.shape)
    xmin=xmin+xIndex-(params['tile_width']>>1)
    ymin=ymin+yIndex-(params['tile_height']>>1)
    xmax=min(int(hdu.properties['width']),xmin+params['tile_width'])
    ymax=min(int(hdu.properties['height']),ymin+params['tile_height'])
    data=hdu.data[ymin:ymax,xmin:xmax]
    response=params
    try:
        response.update(tools.getGaussFit2d(id,{'data':data})['moments'])
    except RuntimeError:
        raise core.AstropypError("Fit does not converge")
    response['x']=int(xmin)
    response['y']=int(ymin)
    response['x_mean']=float(response['x_mean']+xmin)
    response['y_mean']=float(response['y_mean']+ymin)
    response['ra']="pywcs must be installed"
    response['dec']="on server to activate wcs"
    if hdu.properties['wcsAvailable']:
        wcsArray=hdu.wcs.all_pix2world(np.array([[response['x_mean'],response['y_mean']]],np.float_),1)
        response['ra']=str(wcsArray[0][0])
        response['dec']=str(wcsArray[0][1])
    return response

def wcsAlign(id,params):
    core.check4key(params,['reference','openFiles'])
    ref_hdulist=getHDUlist(id,params['reference'])
    try:
        hdu=ref_hdulist[params['reference']['frame']]
    except KeyError:
        raise core.AstropypError("Frame not found in reference fits image")
    if hdu.properties['wcsAvailable']:
        wcsArray=hdu.wcs.all_pix2world(np.array([[params['reference']['xCenter'],params['reference']['yCenter']]],np.float_),1)
        ra=wcsArray[0][0]
        dec=wcsArray[0][1]
    else:
        raise core.AstropypError('Reference image has no wcs information available')
    files=[]
    for i,file in enumerate(params['openFiles']):
        hdulist=getHDUlist(id,file)
        try:
            hdu=hdulist[file['frame']]
        except KeyError:
            raise core.AstropypError("Frame not found in fits image")
        if hdu.properties['wcsAvailable']:
            wcsArray=hdu.wcs.wcs_world2pix(np.array([[ra,dec]],np.float_),1)
            xCenter=wcsArray[0][0]
            yCenter=wcsArray[0][1]
            files.append({
                'fileId':file['fileId'],
                'frame':file['frame'],
                'xCenter':xCenter,
                'yCenter':yCenter,
                'scale':params['reference']['scale'] # assumes all images have the same scale TODO: calculate scale
            })
    response={
        'id':'wcsAlignment',
        'files':files
    }
    return response

def buildDetectParams(all_params,hdu=None):
    mandatory_params=[
        'apertureType',
        'maxima_sigma',
        'fit_method'
    ]
    
    detect_params={}
    for param in mandatory_params:
        detect_params[param]=all_params[param]
    
    if all_params['apertureType']=='width':
        detect_params['maxima_size']=all_params['maxima_size']
    elif all_params['apertureType']=='radius':
        detect_params['maxima_size']=all_params['maxima_radius']
    elif all_params['apertureType']=='footprint':
        detect_params['maxima_footprint']=all_params['maxima_footprint']
    else:
        raise core.AstropypError('Invalid apertureType:'+detect_params['apertureType'])
    
    if not all_params['auto_aperture']:
        detect_params['aperture_radii']=all_params['aperture_radii']
        print('radii:',all_params['aperture_radii'])
        for n,radius in enumerate(all_params['aperture_radii']):
            radius=all_params['aperture_radii'][n]
            print('radius:',radius)
            if radius[1]=='px':
                all_params['aperture_radii'][n]=radius[0]
            else:
                print('app radius:',radius[1])
                raise core.AstropypError("Only aperture_radii='px' is supported at this time")

    if not all_params['auto_thresh']:
        detect_params['threshold']=all_params['threshold']

    if all_params['saturation_method']=='fitsHeader':
        detect_params['saturate']=hdu.header[all_params['saturate_key']]
    elif all_params['saturation_method']=='userSpecify':
        detect_params['saturate']=all_params['saturation']
    elif all_params['saturation_method']!='none':
        raise core.AstropypError('Invalid saturation method')
    
    if not all_params['auto_binStruct']:
        print('binStruct:',all_params['binStruct'])
        detect_params['binStruct']=all_params['binStruct']
    
    if not all_params['auto_margin']:
        detect_params['margin']=all_params['margin']
    
    return detect_params

def findStars(id,params):
    core.check4key(params,['fitsInfo','detectParams','catInfo'])
    core.check4key(params['catInfo'],['path','filename'])
    hdulist=getHDUlist(id,params['fitsInfo'])
    try:
        hdu=hdulist[params['fitsInfo']['frame']]
    except KeyError:
        raise core.AstropypError("Frame not found in fits image")
    
    data=hdu.data
    detect_params=buildDetectParams(params['detectParams'],hdu)
    detect_params['id']=id
    
    sources,badPoints=detect_sources.findStars(data,**detect_params)
    print('first source:', sources[0])
    print('dtypes:', sources.dtype.names)
    srcCat=catalog.Catalog(
        catPath=params['catInfo']['path'],
        catName=params['catInfo']['filename'],
        fitsPath=hdulist.properties['path'],
        fitsName=hdulist.properties['filename'],
        fitsFrame=params['fitsInfo']['frame'],
        fields=list(sources.dtype.names),
        objects=sources,
        wcs=hdu.wcs
    )
    
    if params['detectParams']['use_filter']:
        filter_min=params['detectParams']['filter_min']
        filter_max=params['detectParams']['filter_max']
        if params['detectParams']['filter_var']=='beta' or params['detectParams']['filter_var']=='fwhm':
            invalid_mask=np.where((srcCat[params['detectParams']['filter_var']<filter_min]) | (srcCat[params['detectParams']['filter_var']>filter_max]))
            srcCat['quality'][invalid_mask]=0
    
    catalogId=catalog.getCatalogId(params['catInfo'])
    user=core.active_users[id['userId']]
    if not hasattr(user,'openCatalogs'):
        user.openCatalogs={}
    user.openCatalogs[catalogId]=srcCat
    
    #saveResponse=catalog.saveCatalog(id,{
    #    'path':srcCat.catPath,
    #    'filename':srcCat.catName,
    #    'fileType':'astro'
    #})
    saveResponse={}
    
    sourceFields=['id','objType','x','y','quality']
    if 'sourceFields' in params:
        souceFields=params['souceFields']
    objects=np.array(srcCat.objects,copy=True)
    objects=objects[sourceFields]
    response={
        'catResponse':{
            'id':'catalog',
            'path':srcCat.catPath,
            'catalogId':catalogId,
            'filename':srcCat.catName,
            'name':srcCat.catName,
            'fields':sourceFields,
            'objects':objects.tolist(),
            'coordType':'image',
            'fileType':'astro'
        },
        'saveResponse':saveResponse
    }
    core.progress_log('Sending catalog... this may take a minute or two', id)
    return response