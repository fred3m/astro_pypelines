# catalog.py
# Object Catalog Module for Astropyp
# Copyright 2014 by Fred Moolekamp
# License: GPLv3

from __future__ import division,print_function
import os
import math
import copy
import astropy.io.fits as pyfits
import numpy as np
import numpy.lib.recfunctions as rfn
import inspect
import ast

# astropyp imports
from ...utils import core
from ..fitsviewer import fitsviewer
from ...utils import tools
from . import match

sigfigs=3

CATALOG_TABLE = os.path.join(core.ROOT_DIR,'tables','catalog-tbl.npy')
CATALOG_DTYPES=[
    ('catPath','S200'),
    ('catName','S200'),
    ('fitsPath','S200'),
    ('fitsName','S200'),
    ('fitsFrame',int),
    ('raMin',float),
    ('raMax',float),
    ('decMin',float),
    ('decMax',float),
    ('fields','S2000')
]

try:
    import pywcs
    wcsAvailable=True
except:
    print("pywcs not installed on the server, WCS will not work")
    wcsAvailable=False
sourcesDtypes=[
            ('id','S40'),
            ('ra',float),
            ('dec',float),
            ('raHr',int),
            ('raMin',int),
            ('raSec',float),
            ('decDeg',int),
            ('decMin',int),
            ('decSec',float),
            ('srcType','S20')
        ]
openSources=np.array([],sourcesDtypes)
class AstroSource:
    def __init__(self,wcsCoords,srcType='unknown',imgFiles=[],catalogs=[],extSources=[]):
        """ Arguments:
                wcsCoords: wcs coordinates of the source as a either a dict of real numbers or sexagesimal numbers
                    Examples:
                        wcsCoords={'ra':178.345,'dec':-79.4}
                                           or
                        wcsCoords={
                            'ra':{
                                'hr':15,
                                'min':12,
                                'sec':36.345
                            },
                            'dec':{
                                'deg':-79,
                                'min':16,
                                'sec':12.412
                            }
                        }
                srcType: Type of object (if source has been identified)
                    Examples:
                        'star' or 'galaxy' or 'asteroid', etc.
                imgFiles: List of fits file names that include the object or a list of open fits files
                    Example:
                        [os.path.join(ROOT_DIR,'images','image1.fits),os.path.join(ROOT_DIR,'images','image2.fits)]
                catalogs: List of catalog file names or open catalogs
                    Examples:
                        [os.path.join(ROOT_DIR,'catalogs','cat1.fits),os.path.join(ROOT_DIR,'catalogs','cat2.fits)]
                extSources: List of external sources (for example Simbad)
                    TODO: implement this
            
        """
        wcsInfo=getWCSinfo(wcsCoords)
        data=(
            wcsInfo['id'],
            wcsInfo['ra'],
            wcsInfo['dec'],
            wcsInfo['ra']['hr'],
            wcsInfo['ra']['min'],
            wcsInfo['ra']['sec'],
            wcsInfo['dec']['deg'],
            wcsInfo['dec']['min'],
            wcsInfo['dec']['sec'],
            srcType
        )
        self.data=np.array(data,dtype=sourceDtypes)
        self.imgFiles=imgFiles
        self.catalogs=catalogs
        self.extSources=extSources
    
    def getInfo(self,catalog=None):
        """ Returns info for the source from either a specified catalog or all of the catalogs that contain the object
            Arguments:
                catalog: optional pointer to catalog object that contains the source. If this field is missing the 
                    function will return infomation from every catalog containing the object
            Returns:
                Structured np.array
        """
        # to get the name of each field use self.data.dtype.names
        myInfo=np.array(self.data,copy=True)
        if catalog is None:
            for n,cat in enumerate(self.catalogs):
                catalog=openCatalog(cat)
                objects=np.sort(catalog[objects],order='id')['objects']
                myInfo=rfn.merge_arrays(myInfo,obj)
        return myInfo

class Catalog:
    def __init__(self,catPath,catName,fitsName,fitsPath,fitsFrame,fields=[],objects=[],wcs=None,**kwargs):
        print('Made it to init catatlog')
        self.catPath=catPath
        self.catName=catName
        self.fitsName=fitsName
        self.fitsPath=fitsPath
        self.fitsFrame=fitsFrame
        self.fields=fields
        self.objects=objects
        self.wcs=wcs
        print('defined variables')
        if 'ra' in objects.dtype.names and 'dec' in objects.dtype.names:
            self.raMin=np.amin(self.objects['ra'])
            self.raMax=np.amax(self.objects['ra'])
            self.decMin=np.amin(self.objects['dec'])
            self.decMax=np.amax(self.objects['dec'])
        elif wcs is not None:
            print('Calculating wcs for all sources')
            ras=[]
            decs=[]
            for n,obj in enumerate(self.objects):
                wcsCoords=self.image2wcs(obj['x'],obj['y'])
                ras.append(wcsCoords['ra'])
                decs.append(wcsCoords['dec'])
            self.objects=rfn.append_fields(self.objects,'ra',ras,float)
            self.objects=rfn.append_fields(self.objects,'dec',decs,float)
            self.raMin=np.amin(self.objects['ra'])
            self.raMax=np.amax(self.objects['ra'])
            self.decMin=np.amin(self.objects['dec'])
            self.decMax=np.amax(self.objects['dec'])
            print('Finished wcs')
        else:
            print('no wcs?')
            self.raMin=0
            self.raMax=360
            self.decMin=-90
            self.decMax=90
        for key,value in kwargs:
            self.info[key]=value
        if 'id' not in self.objects.dtype.names:
            if 'ra' in self.objects.dtype.names and 'dec' in self.objects.dtype.names:
                ids=[]
                for n,obj in enumerate(self.objects):
                    wcsInfo=getWCSinfo({'ra':obj['ra'],'dec':obj['dec']})
                    ids.append(wcsInfo['id'])
                self.objects=rfn.append_fields(self.objects,'id',ids,'S40')
            else:
                print('made it to use x,y')
                ids=[]
                for n,obj in enumerate(self.objects):
                    ids.append(str(obj['x'])+'-'+str(obj['y']))
                self.objects=rfn.append_fields(self.objects,'id',ids,'S40')
        if 'objType' not in self.objects.dtype.names:
            objTypes=['unknown' for i in range(len(self.objects))]
            self.objects=rfn.append_fields(self.objects,'objType',objTypes,'S20')
        if 'quality' not in self.objects.dtype.names:
            quality=[100 for i in range(len(self.objects))]
            self.objects=rfn.append_fields(self.objects,'quality',quality,int)
    
    def image2wcs(self,x,y):
        wcsArray=self.wcs.all_pix2world(np.array([[x,y]],np.float_),1)
        wcs={
            'ra':str(wcsArray[0][0]),
            'dec':str(wcsArray[0][1])
        }
        return wcs
    def wcs2image(self,ra,dec):
        coordsArray=self.wcs.wcs_world2pix(np.array([[ra,dec]],np.float_),1)
        coords={
            'x':coordsArray[0][0],
            'y':coordsArray[0][1]
        }
        return coords
    
    def getXYrange(self,x,y,matches=-1):
        avgDist=(self.xMax-self.xMin)*(self.yMax-self.yMin)/len(self.objects)
        print(avgDist)
        return matchsorted(self.objects,x,y,avgDist,'px',matches)
    
    def getWCSrange(self,ra,dec,matches=-1):
        avgDist=(self.raMax-self.raMin)*(self.decMax-self.decMin)/len(self.objects)
        print(avgDist)
        return matchsorted(self.objects,ra,dec,avgDist,'deg',matches)
    
    def addObject(self,obj):
        #TODO check to see that the object has the correct format
        self.objects.append(obj)
    
    def getAsNParray(self):
        fields=str(self.fields)
        dtypes=CATALOG_DTYPES
        print('dtypes now:',dtypes)
        entry=(self.catPath,self.catName,self.fitsPath,self.fitsName,self.fitsFrame,self.raMin,self.raMax,self.decMin,self.decMax,fields)
        print('entry:',entry)
        return np.array(entry,dtype=dtypes)

def matchsorted(objArray,coord1,coord2,dist,distUnits,matches=1):
    """ Find the closest point to coord1,coord2 within a distance dist
        Based on the function matchsorted in match.py by H. Ferguson 11/22/05
        Modifications:
            -Allows input to be either image x,y coords or wcs
            -Uses structured np.array's
            -Can return multiple sources within dist
            -Allows different units
    
        Arguments:
            objArray: structured np.array with orthogonal coordinate system (eg. x,y and/or ra,dec), sorted by
                        either ra or x
                Example:
                    data=np.array([1500,115,178.345,-79.4,'star'])
                    dtypes=[('x',int),('y',int),('ra',float),('dec',float),('objType','S10')]
                    objArray=np.array(data,dtype=dtypes)
            coord1,coord2: Either x,y (in pixels) or ra,dec (in degrees)
            dist: maximum distance between the points to be considered a match
            distUnits: Units of dist ('px' for x,y; 'deg','arcsec','mas' for ra,dec)
                Note: mas is milli-arcsec
            matches: number of matches to return (this may be useful if you want all the sources
                     within a certain distance of a target source).
                     If matches=-1, all sources within dist will be returned
            sortedFlag: True=objArray is already sorted, False=function will perform sort
                Note: If you are planning on calculating a lot of nearest neighbors it is best
                to do this outside the function
        Returns:
             match: index of the best match within dist; -1 if no match within dist
             separation: separation (defaults to dist if no match within dist)
    """
    sortIdx1='ra'
    sortIdx2='dec'
    diff=dist
    unitConvert=1
    if distUnits not in ['px','deg','arcsec','mas']:
        raise core.AstropypError('Invalid coordinate type')
    elif distUnits=='px':
        sortIdx1='x'
        sortIdx2='y'
        diff=dist**2
    elif distUnits=='arcsec':
        diff=dist/3600
        unitConvert=3600
    elif distUnits=='mas':
        diff=dist/3600000
        unitConvert=3600000
    iMin=np.searchsorted(objArray[sortIdx1],coord1-dist)-1
    iMax=np.searchsorted(objArray[sortIdx1],coord1+dist)+1
    if iMin<0:
        iMin=0
    separation=np.array([])
    diff=dist
    if distUnits=='px':
        separation=(objArray[sortIdx1][iMin:iMax]-coord1)**2+(objArray[sortIdx2][iMin:iMax]-coord2)**2
        diff=dist**2
    else:
        separation=match.angsep(objArray[sortIdx1][iMin:iMax],sortedOjbs[sortIdx2][iMin:iMax],coord1,coord2)
    
    indices=np.where(separation<diff)[0]
    sep=separation[indices]
    if len(indices)==0:
        print('no match found')
        return -1,dist
    if matches>0:
        indices=np.argsort(separation)[:min(matches,len(indices))]
        sep=separation[indices]
    if matches==1:
        indices=indices[0]
        sep=sep[0]
    if distUnits=='px':
        sep=np.sqrt(sep)
    match=indices+iMin
    return match,sep*unitConvert

def matchpos(objArray1,objArray2,dist,distUnits,sortedFlag=True):
    """ Find the best match for each object in objArray1 and objArray2
        Based on the function matchpos in match.py by H. Ferguson 11/22/05
        Modifications of Fergusons code:
            -Use of structured np.array's
            -No longer requires larger array first
            -Output is now the map from objArray2 to objArray1 (intead of the opposite)
        
        Arguments:
            objArray1,objArray2: structured np.array with orthogonal coordinate system (eg. x,y and/or ra,dec)
                Example:
                    data=np.array([1500,115,178.345,-79.4,'star'])
                    dtypes=[('x',int),('y',int),('ra',float),('dec',float),('objType','S10')]
                    objArray=np.array(data,dtype=dtypes)
            dist: maximum distance between the points to be considered a match
            distUnits: Units of dist ('px' for x,y; 'deg','arcsec','mas' for ra,dec)
                Note: mas is milli-arcsec
        Returns:
             np.array of indices of objArray2 to match objArray1
             np.array of separations of objArray2 to match objArray1
    """
    sortIdx1='ra'
    sortIdx2='dec'
    if distUnits not in ['px','deg','arcsec','mas']:
        raise core.AstropypError('Invalid coordinate type')
    elif distUnits=='px':
        sortIdx1='x'
        sortIdx2='y'
        
    objects1=objArray1
    objects2=objArray2
    if len(objArray1)<len(objArray2):
        objects1=objArray2
        objects2=objArray1
    objects1=np.sort(objects1,order=sortIdx1)
    indices=[]
    separations=[]
    for i in range(len(objects2)):
        index,diff=matchsorted(objArray,objects2[sortIdx1][i],objects2[sortIdx2][i],dist,distUnits)
        indices.append(index)
        separations.append(diff)
    
    # If we switched the order, the above routine generates a map from objArray2 to objArray1
    # Otherwise we have a map from objArray1 to objArray2. In that case we need to switch the
    # order of the arrays
    if len(objArray1)>len(objArray2):
        oldIndices=list(indices)
        oldSeps=list(separations)
        indices=np.linspace(-1,-1,len(oldIndices))
        separations=np.linspace(dist,dist,len(oldIndices))
        for i in range(len(oldIndices)):
            index=oldIndices[i]
            if index>=0:
                indices[index]=i
                separations[index]=i
    
    return np.array(indices),np.array(separations)

def getNearestNeighbor(objArray,index,dist,distUnits='mas',sortedFlag=True):
    """ Find the nearest neigbor to a point by removing it from an array and searching for the closest match
        If no match is found, dist is doubled and the function is run recursively until a match is found
        
        Arguments:
            objArray: structured np.array with orthogonal coordinate system (eg. x,y and/or ra,dec)
                Example:
                    data=np.array([1500,115,178.345,-79.4,'star'])
                    dtypes=[('x',int),('y',int),('ra',float),('dec',float),('objType','S10')]
                    objArray=np.array(data,dtype=dtypes)
            index: index of the reference source object
            dist: maximum distance expected between the points
            distUnits: Units of dist ('px' for x,y; 'deg','arcsec','mas' for ra,dec)
                Note: mas is milli-arcsec
            sortedFlag: True=objArray is already sorted, False=function will perform sort
                Note: If you are planning on calculating a lot of nearest neighbors it is best
                to do this outside the function
        Returns:
             index: index of the nearestNeighbor
             diff: distance to the nearest neighbor
    """
    coord1=obj['ra']
    coord2=obj['dec']
    orderIdx='ra'
    obj=objArray[index]
    if distUnits not in ['px','deg','arcsec','mas']:
        raise core.AstropypError('Invalid coordinate type')
    elif distUnits=='px':
        coord1=obj['x']
        coord2=obj['y']
        orderIdx='x'
    objects=np.delete(objArray,index)
    if not sortedFlag:
        objects=np.sort(objects,order=orderIdx)
    index,diff=matchsorted(objects,coord1,coord2,dist,distUnits)
    if index<0:
        dist*=2
        index,diff=getNearestNeighbor(objArray,index,dist,distUnits,True)
    return index,diff

def getNearestNeighbors(objArray,index,dist,distUnits='mas',sortedFlag=False):
    """ Find the nearest neigbor for every source in the objectArray
        
        Arguments:
            objArray: structured np.array with orthogonal coordinate system (eg. x,y and/or ra,dec)
                Example:
                    data=np.array([1500,115,178.345,-79.4,'star'])
                    dtypes=[('x',int),('y',int),('ra',float),('dec',float),('objType','S10')]
                    objArray=np.array(data,dtype=dtypes)
            index: index of the reference source object
            dist: maximum distance expected between the points
            distUnits: Units of dist ('px' for x,y; 'deg','arcsec','mas' for ra,dec)
                Note: mas is milli-arcsec
            sortedFlag: True=objArray is already sorted, False=function will perform sort

        Returns:
             np.array of indices of the nearest neighbor for each source
             distance to the nearest neighbor for each star
    """
    orderIdx='ra'
    if distUnits not in ['px','deg','arcsec','mas']:
        raise core.AstropypError('Invalid coordinate type')
    elif distUnits=='px':
        orderIdx='x'
    objects=np.sort(objArray,order=orderIdx)
    indices=[]
    distances=[]
    for n in range(len(objects)):
        index,diff=getNearestNeighbor(objects,n,dist,distUnits,True)
        indices.append(index)
        distances.append(diff)
    return np.array(indices),np.array(distances)

def getWCSinfo(wcsCoords):
    """ Returns a dict of wcs coordinates in both sexagesimal and decimal representations
        wcsCoords: wcs coordinates of the source as a either a dict of real numbers or sexagesimal numbers
            Examples:
                wcsCoords={'ra':178.345,'dec':-79.4}
                                   or
                wcsCoords={
                    'ra':{
                        'hr':15,
                        'min':12,
                        'sec':36.345
                    },
                    'dec':{
                        'deg':-79,
                        'min':16,
                        'sec':12.412
                    }
                }
    """
    wcs={}
    ra=0
    dec=0
    if isinstance(wcsCoords['ra'],dict):
        wcs['ra']=wcsCoords['ra']
        ra=tools.ra2deg(wcsCoords['ra'])
    else:
        ra=wcsCoords['ra']
        wcs['ra']=tools.deg2ra(wcsCoords['ra'])
    if isinstance(wcsCoords['dec'],dict):
        wcs['dec']=wcsCoords['dec']
        dec=tools.sex2deg(wcsCoords['dec'])
    else:
        dec=wcsCoords['dec']
        wcs['dec']=tools.deg2sex(wcsCoords['dec'])
    raList=[str(wcs['ra']['hr']),
        str(wcs['ra']['min']),
        str(round(wcs['ra']['sec']*10**sigfigs)/10**sigfigs)
    ]
    decList=[str(wcs['dec']['deg']),
        str(wcs['dec']['min']),
        str(round(wcs['dec']['sec']*10**sigfigs)/10**sigfigs)
    ]
    id=' '.join(raList+decList)
    return{
        'id':id,
        'ra':ra,
        'dec':dec,
        'raSex':wcs['ra'],
        'decSex':wcs['dec']
    }

def getType(x):
    if tools.isNumber(x):
        if x.find('.')>=0:
            return 'float'
        else:
            return 'int'
    else:
        return 'S20'

def getSexCat(path,filename,fitsName='',fitsPath='',fitsFrame=0):
    print('Reading Sextractor File\n')
    sexFile=open(os.path.join(path,filename),'r')
    fields=[]
    line=sexFile.readline()
    entry=filter(None,line.split())
    while entry[0]=='#':
        field=entry[2]
        if field=='X_IMAGE':
            field='x'
        elif field=='Y_IMAGE':
            field='y'
        elif field=='X_WORLD':
            field='ra'
        elif field=='Y_WORLD':
            field='dec'
        fields.append({
            'field':field,
            'description':' '.join(entry[3:-1]),
            'units':entry[-1]
        })
        line=sexFile.readline()
        entry=filter(None,line.split())
    dtypes=[]
    for n,field in enumerate(fields):
        dtypes.append((field['field'],getType(entry[n])))
    print('dtypes:\n',dtypes)
    sexFile.close()
    data=np.genfromtxt(os.path.join(path,filename),dtype=dtypes)
    print('Finished Reading File, adding catalog to server')
    catalog=Catalog(path,filename,fitsName,fitsPath,fitsFrame,fields,data)
    print('finished loading sextractor catalog')
    return catalog

def getCatalogId(params):
    return os.path.join(params['path'],params['filename']);

def loadCatalogTbl():
    if os.path.isfile(CATALOG_TABLE):
        catalogTbl=np.load(CATALOG_TABLE)
        return catalogTbl
    else:
        np.save(CATALOG_TABLE,np.array([],dtype=CATALOG_DTYPES))
        return np.array([],dtype=CATALOG_DTYPES)

def saveCatalogTbl(catalogTbl):
    np.save(CATALOG_TABLE,catalogTbl)

def loadCatalog(id,params):
    core.check4key(params,['path','filename','coordType','fitsInfo'])
    print('fits info',params['fitsInfo'])
    sourceFields=['id','objType']
    if 'sourceFields' in params:
        souceFields=params['souceFields']
    catalog=None
    fileType=''
    if params['type']=='sex':
        catalog=getSexCat(params['path'],params['filename'])
        if catalog.fitsPath=='':
            catalog.fitsPath=params['fitsInfo']['path']
            catalog.fitsName=params['fitsInfo']['filename']
            catalog.fitsFrame=params['fitsInfo']['frame']
        fileType='sex'
    elif params['type']=='astro':
        catObjects=np.load(os.path.join(params['path'],params['filename']))
        catalogTbl=loadCatalogTbl()
        try:
            catInfo=catalogTbl[('catPath'==params['path']) & ('catName'==params['filename'])]
            catalog=Catalog(
                params['path'],
                params['filename'],
                catInfo['fitsName'],
                catInfo['fitsPath'],
                catInfo['fitsFrame'],
                ast.literal_eval(catInfo['fields']),
                catObjects)
        except IndexError:
            catParams={
                'catPath':params['path'],
                'catName':params['filename'],
                'objects':catObjects,
                'fitsPath':params['fitsInfo']['path'],
                'fitsName':params['fitsInfo']['filename'],
                'fitsFrame':params['fitsInfo']['frame']
            }
            catalog=Catalog(**catParams)
        fileType='astro'
    else:
        raise core.AstropypError("That file format is not yet supported")
    objects=np.array(catalog.objects,copy=True)
    if params['coordType']=='image':
        sourceFields+=['x','y']
    elif params['coordType']=='wcs':
        try:
            hdulist=fitsviewer.getHDUlist(id,params['fitsInfo'])
            hdu=hdulist[params['fitsInfo']['frame']]
            catalog.wcs=hdu.wcs
            for n,obj in enumerate(objects):
                imgCoords=catalog.wcs2image(obj['ra'],obj['dec'])
                objects[n]['x']=imgCoords['x']
                objects[n]['y']=imgCoords['y']
            sourceFields+=['x','y']
        except KeyError:
            raise core.AstropypError("Unable to load specified fits file to obtain wcs")
    catalogId=getCatalogId(params)
    objects=objects[sourceFields]
    response={
        'id':'catalog',
        'path':params['path'],
        'catalogId':catalogId,
        'filename':params['filename'],
        'name':params['filename'],
        'fields':sourceFields,
        'objects':objects.tolist(),
        'coordType':params['coordType'],
        'fileType':fileType
    }
    print('response fields',response['fields'])
    user=core.active_users[id['userId']]
    if not hasattr(user,'openCatalogs'):
        user.openCatalogs={}
    user.openCatalogs[catalogId]=catalog
    print('sending catalog')
    return response

def saveCatalog(id,params):
    core.check4key(params,['path','filename','fileType'])
    user=core.active_users[id['userId']]
    catalogId=getCatalogId(params)
    try:
        catalog=user.openCatalogs[catalogId]
    except KeyError:
        core.AstropypError('Catalog is not opened on the server')
    if 'newFilename' in params:
        catalog.catPath=params['newFilename']['path']
        catalog.catName=params['newFilename']['filename']
        if not params['confirmed']:
            if os.path.isfile(os.path.join(catalog.catPath,catalog.catName)):
                response={
                    'id':'save catalog',
                    'status':'confirm',
                    'params':params
                }
                return response
    elif params['fileType']!='astro':
        raise core.AstropypError('Astropyp saves catalaogs in a custom format. Please choose a new filename so that your external catalog file is not overwritten')

    catalogTbl=loadCatalogTbl()
    catArray=catalog.getAsNParray()
    try:
        catalogTbl[('catPath'==catalog.catPath) & ('catName'==catalog.catName)]=catArray
    except IndexError:
        catalogTbl=np.hstack((catalogTbl,catArray))
    saveCatalogTbl(catalogTbl)
    print(os.path.join(catalog.catPath,catalog.catName))
    print('catTble',catalogTbl)
    catalog.objects.dump(os.path.join(catalog.catPath,catalog.catName))
        
    response={
        'id':'save catalog',
        'status':'saved'
    }
    return response

def getSourceInfo(id,params):
    core.check4key(params,['path','filename','wcsConvert','coord1','coord2'])
    user=core.active_users[id['userId']]
    catalogId=getCatalogId(params)
    try:
        catalog=user.openCatalogs[catalogId]
    except (KeyError,AttributeError):
        loadCatalog(id,params)
        catalog=user.openCatalogs[catalogId]
    
    maxDist=10
    distUnits='px'
    if 'maxDist' in params:
        maxDist=params['maxDist']
    if 'distUnits' in params:
        distUnits=params['distUnits']
    if params['wcsConvert']:
        hdulist=fitsviewer.getHDUlist(id,params['image'])
        hdu=hdulist[params['image']['frame']]
        wcsArray=hdu.wcs.all_pix2world(np.array([[params['coord1'],params['coord2']]],np.float_),1)
        wcsCoords={
            'ra':str(wcsArray[0][0]),
            'dec':str(wcsArray[0][1])
        }
        coords=catalog.wcs2image(wcsCoords['ra'],wcsCoords['dec'])

    sortedObjs=np.sort(catalog.objects,order='x')
    index,diff=matchsorted(sortedObjs,params['coord1'],params['coord2'],maxDist,distUnits)
    if index<0:
        return {}
    obj=sortedObjs[index]
    fields=obj.dtype.names
    response={
        'id':'sourceInfo',
        'catalog':os.path.join(params['path'],params['filename']),
        'info':obj.tolist(),
        'fields':fields,
        'separation':diff,
        'sepUnits':distUnits
    }
    return response

def saveSource(id,params):
    core.check4key(params,['path','filename','fileType','info'])
    if params['fileType']!='astro':
        print('fileType:',params['fileType'])
        response={
            'id':'save source',
            'status':'failed',
            'reason':'Invalid file type. You must save the catalog first (click "Save as"), then you can update it.'
        }
        return response
    user=core.active_users[id['userId']]
    catalogId=getCatalogId(params)
    try:
        catalog=user.openCatalogs[catalogId]
    except (KeyError,AttributeError):
        loadCatalog(id,params)
        catalog=user.openCatalogs[catalogId]
    
    data=np.array(tuple(params['info']['info']),dtype=catalog.objects.dtype)
    source=catalog.objects[catalog.objects['id']==data['id']]
    if len(source)>0:
        catalog.objects=np.sort(catalog.objects,order='id')
        index=np.searchsorted(catalog.objects['id'],data['id'])
        catalog.objects[index]=data
    elif 'addNew' in params and params['addNew']:
        print('added a new source')
        np.hstack((catalog.objects,data))
    else:
        raise core.AstropypError('Source not found in catalog')
    
    print('catalog entry',catalog.objects[catalog.objects['id']==data['id']])
    
    response={
        'id':'save source',
        'status':'saved'
    }
    return response

def removeSource(id,params):
    core.check4key(params,['path','filename','fileType','id'])
    if params['fileType']!='astro':
        print('fileType:',params['fileType'])
        response={
            'id':'remove source',
            'status':'failed',
            'reason':'Invalid file type. You must save the catalog first (click "Save as"), then you can update it.'
        }
        return response
    user=core.active_users[id['userId']]
    catalogId=getCatalogId(params)
    try:
        catalog=user.openCatalogs[catalogId]
    except (KeyError,AttributeError):
        loadCatalog(id,params)
        catalog=user.openCatalogs[catalogId]
    lengthBefore=len(catalog.objects)
    catalog.objects=catalog.objects[catalog.objects['id']!=params['id']]
    print('after remove:',catalog.objects[catalog.objects['id']==params['id']])
    if lengthBefore==len(catalog.objects):
        response={
            'id':'remove source',
            'status':'failed',
            'reason':'Could not matching source in catalog to remove'
        }
    else:
        response={
            'id':'remove source',
            'status':'removed'
        }
    return response

def addSource(id,params):
    core.check4key(params,['path','filename','fileType','info','fields'])
    if params['fileType']!='astro':
        print('fileType:',params['fileType'])
        response={
            'id':'add source',
            'status':'failed',
            'reason':'Invalid file type. You must save the catalog first (click "Save as"), then you can update it.'
        }
        return response
    user=core.active_users[id['userId']]
    catalogId=getCatalogId(params)
    try:
        catalog=user.openCatalogs[catalogId]
    except (KeyError,AttributeError):
        loadCatalog(id,params)
        catalog=user.openCatalogs[catalogId]
    
    hdulist=fitsviewer.getHDUlist(id,{
        'path':catalog.fitsPath,
        'filename':catalog.fitsName
    })
    hdu=hdulist[catalog.fitsFrame]
    wcsArray=hdu.wcs.all_pix2world(np.array([[params['info']['x'],params['info']['y']]],np.float_),1)
    wcsCoords={
        'ra':wcsArray[0][0],
        'dec':wcsArray[0][1]
    }
    wcsInfo=getWCSinfo(wcsCoords)
    data=[np.nan for i in range(len(catalog.objects.dtype.names))]
    data[catalog.objects.dtype.names.index('id')]=wcsInfo['id']
    data[catalog.objects.dtype.names.index('x')]=params['info']['x']
    data[catalog.objects.dtype.names.index('y')]=params['info']['y']
    data[catalog.objects.dtype.names.index('ra')]=wcsCoords['ra']
    data[catalog.objects.dtype.names.index('dec')]=wcsCoords['dec']
    data[catalog.objects.dtype.names.index('objType')]=params['info']['objType']
    
    print('data:',data)
    
    catalog.objects=np.hstack((catalog.objects,np.array(tuple(data),dtype=catalog.objects.dtype)))
    print('Added Object',catalog.objects[(catalog.objects['id']==wcsInfo['id'])])
    newObj=catalog.objects[(catalog.objects['id']==wcsInfo['id'])]
    fields=[str(field) for field in params['fields']]
    print('fields:',fields)
    print('just checking:',newObj[fields].tolist())
    response={
        'id':'add source',
        'status':'added',
        'data':newObj[fields].tolist()[0]
    }
    return response