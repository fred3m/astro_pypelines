from __future__ import division,print_function
import os
import hashlib
import astropyp.utils.core as core


openFits={} # fits files open by current users
openHDUs={} # hdu's (image fits frames) open by current users
DEFAULT_TILE_WIDTH=400 # default width of an image tile in the fits viewer
DEFAULT_TILE_HEIGHT=200 # default height of an image tile in the fits viewer

def getFileId(params):
    """
    getFileId
    
    Use md5 hash function to generate an id for a fits file based on its path and filename
    
    Parameters
    ----------
    params: dictionary
        - Dictionary that contains the path and filename to be converted into a fileId
    
    Returns
    -------
    fileId: string
        - md5 hash created from the input path and filename
    """
    
    core.check4key(params,['filename','path'])
    return hashlib.md5(os.path.join(params['path'],params['filename'])).hexdigest()

def getHDUlist(id,params):
    """
    getHDUlist
    
    Given a fileId or path/filename, load a fits file from memory (if it has been stored already) or
    load the fits file into memory and returns the hdulist.
    
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
    hdulist: list
        - List of hdu's (fits file frames) generated by astropy.io.fits (pyfits)
    """
    fileId=''
    if 'fileId' in params:
        fileId=params['fileId']
    elif 'path' in params and 'filename' in params:
        fileId=getFileId(params)
        params['fileId']=fileId
    else:
        raise core.AstropypError("fileId or path/filename required")
    try:
        hdulist=openFits[fileId]
        return hdulist
    except KeyError as error:
        print("Could not find",params['fileId'],"loading fits file")
        response=loadFitsFile(id,params)
        core.respond(id, response)
        return openFits[response['fileId']]

def getTileId(tile):
    """
    getTileId
    
    Generates a (semi) unique id for a tile based on its properties. When a tile is extracted from a fits image
    into a png file, the png file is saved into a temporary directory on the server. Often browsers cache images
    and because the user will be manipulating the colors and scale of the image we make sure to include enough
    parameters in the creation of the tileId to ensure that if an image is manipulated, the browser will load
    the correct cached image (if one exists).
    
    Parameters
    ----------
    tile: dictionary
        -Dictionary that contains the tile information
        - Required keys:
            x: int
                -x coordinate of the lower right hand corner of the tile (in pixels)
            y: int
                -y coordinate of the lower right hand corner of the tile (in pixels)
            tile_width: int
                - width of the tile (in pixels)
            tile_height: int
                - height of the tile (in pixels)
            scale: float
                - Scale of the tile (scale=1 has 1 pixel for each element of the image array)
            colormap: dictionary
                - Colormap that describes the function to assign a color for each value of the image array
    
    Returns
    -------
    tileId: string
        - md5 hash that gives the filename for a tile with a given set of properties
    """
    core.check4key(tile,['x','y','tile_width','tile_height','scale','colormap'])
    tileId='-'.join([
        str(tile['x']),
        str(tile['y']),
        str(tile['tile_width']),
        str(tile['tile_height']),
        str(int(tile['scale']*10000)),
        str(tile['colormap'])
    ])
    return hashlib.md5(tileId).hexdigest()