from __future__ import division,print_function

import sys
import numpy as np
import numpy.lib.recfunctions as rfn
import scipy.ndimage.filters as filters
import scipy.ndimage as ndimage
from scipy.optimize import curve_fit

import astropyp.utils.core as core

# Format of the output for each fit type
fit_dtypes={
    'circular moffat':[
        ('x',float),
        ('y',float),
        ('fwhm',float),
        ('beta',float),
        ('height',float),
        ('floor',float)
    ],
    'elliptical moffat':[
        ('x',float),
        ('y',float),
        ('fwhm1',float),
        ('fwhm2',float),
        ('beta',float),
        ('angle',float),
        ('height',float),
        ('floor',float)
    ],
    'fast':[
        ('x',float),
        ('y',float),
        ('fwhm1',float),
        ('fwhm2',float),
        ('beta',float),
        ('angle',float),
        ('height',float),
        ('floor',float),
        ('status', float)
    ],
    'circular gaussian':[
        ('x',float),
        ('y',float),
        ('sigma',float),
        ('height',float),
        ('floor',float),
    ],
    'elliptical gaussian':[
        ('x',float),
        ('y',float),
        ('sigma_x',float),
        ('sigma_y',float),
        ('angle',float),
        ('height',float),
        ('floor',float)
    ],
    'no fit':[
        ('x',float),
        ('y',float)
    ]
}

def getCircleFoot(radius):
    """
    getCircleFoot
    
    Generates a circular binary structure with a given radius in O(n) time
    
    Parameters
    ----------
    radius: int
        - radius of the binary structure
    
    Returns
    -------
    footprint: 2d numpy array
        - Circular binary structure with 1's inside the circle and 0's outside
    """
    footprint=np.zeros((2*radius+1,2*radius+1),dtype=int)
    footprint_length=len(footprint)
    for n,row in enumerate(footprint):
        y=abs(radius-n)
        if n>0 and n<footprint_length-1:
            xmin=radius-round(np.sqrt(radius**2-y**2))
        else:
            delta=y
            while round(np.sqrt(delta**2+y**2))>radius:
                delta-=1
            xmin=y-delta
        xmax=footprint_length-xmin
        row[xmin:xmax]=1
    return footprint

def detectSources(imgData,threshold,apertureType='radius',size=5,footprint=None,binStruct=None,
                    sigma=2,saturate=None,margin=None):
    """
    Erodes the background to isolate sources and selects the maximum as approximate positions of sources

    Parameters
    ----------
    imgData: numpy 2D array
        image data
    
    threshold: float
        minimum pixel value above the background noise
    
    size: int, optional
        width of the area in which to search for a maximum (for each point)
    footprint: numpy 2D array (dtype=boolean),optional
        Instead of supplying a size, a footprint can be given of a different shape to use for finding a footprint
            example:
                footprint=np.array([
                    [0,0,1,0,0],
                    [0,1,1,1,0],
                    [1,1,1,1,1],
                    [0,1,1,1,0],
                    [0,0,1,0,0]
                ])
            The above example would only seach for a maximum in the pixels labeled by 1 in the region
            centered on a given pixel
    Note: either a size or a footprint must be secified
    
    binStruct: 2D numpy array,optional
        Minimum structure that regions of the image are shrunk down to in order to isolate maxima
    sigma: float, optional
        This function uses a guassian filter to smooth the image (only for detection of sources),
        which helps eliminate multiple maximum detections for the same object. 'sigma' describes the
        standard deviation of the gaussian kernel used in the filter
    saturate: float,optional
        Value at which CCD's for the detector become saturated and are no longer linear
    margin: int, optional
        Sources close to the edges can be cut off to prevent partial data from becoming mixed up with good detections
      
    Returns
    -------  
    maxima: numpy 2D array
        Approximate locations of the source maximum values.
        To get more accurate positions each maxima should be fit to a desired profile
    """
    # Make a mask where elements above the threshold are True and below the threshold are False.
    # This essentially removes the background and leaves islands of 1's, representing possible sources
    binData=imgData>=threshold

    # The binary_opening function shrinks all of the 'islands' from the previous step into binary structes,
    # then it dilates them again back to their original shape and width.
    # Shape of the created binary structure (if not specified by the user):
    #   010
    #   111
    #   010
    
    if binStruct is None:
        binStruct=ndimage.generate_binary_structure(2,1)
    binData=ndimage.binary_opening(binData,structure=binStruct)

    # Use our binary data to mask the image and blur the image so get rid of small local maxima that will
    # give us false positive sources
    data=filters.gaussian_filter(binData*imgData,sigma=sigma)

    # The maximum/minimum filters select max/min value in a square with sides length 'size' centered on
    # each element. Filter out all of the objects below the threshold
    params={'input':data}
    if apertureType=='width':
        params['size']=size
    elif apertureType=='radius':
        params['footprint']=getCircleFoot(size)
    elif apertureType=='footprint':
        params['footprint']=footprint
    else:
        raise core.AstropypError('Invalid aperture type in detectSources')        
    
    # Search for the maximum and minimum points to determine the height of the pixel above its neighboring pixels
    # Note: this only gives the height above the background if the background is within size/2 (or the footprint)
    # of a given pixel.
    data_max=filters.maximum_filter(**params)
    maxima=(data==data_max)
    data_min=filters.minimum_filter(**params)
    diff=((data_max-data_min)>threshold)
    maxima[diff==0]=0

    # Filter out the saturated objects
    if saturate is not None:
        maxima[data>saturate]=0
    
    # Remove the sources near the margins that will be cut off.
    # TODO: Dump these in another file as they will still be useful in determining isolated
    # neighbors for PSF stars
    if margin is None:
        margin=int(size/2)
    if isinstance(margin,list):
        maxima[-margin[0]:,:]=0
        maxima[:margin[1],:]=0
        maxima[:,-margin[2]:]=0
        maxima[:,:margin[3]]=0
    else:
	    maxima[-margin:,:]=0
	    maxima[:margin,:]=0
	    maxima[:,-margin:]=0
	    maxima[:,:margin]=0
    lbl,nbrLbl=ndimage.label(maxima)
    return maxima

def circularMoffat((x,y),x_mean, y_mean,beta,alpha,height,floor):
    """
    Uses 2d array of data to calculate a moffat distribution at the point (x,y), then flattens the data
    into a 1d array for processing.
    
    Parameters
    ----------
    (x,y): tuple of 2D numpy arrays
        Grid of points used to calculate the value of the function
        example:x=np.linspace(0,width-1,width)
                y=np.linspace(0,height-1,height)
                x,y=np.meshgrid(x, y)
    x_mean,y_mean: floats
        location of the maximum (or peak) of the distribution
    alpha,beta: floats
        parameters that describe the shape of a moffat distribution
    floor: float
        lowest asymptotic point of the distribution
    height: float
        maximum height of the distribution above the floor
    
    Returns
    -------
    moff.ravel(): 1D numpy array
        Value of the distribution for the given set of parameters, flattened into a 1D array
        so that it can be used with the curve_fit function
    """
    moff=floor + height/((1+(((x-x_mean)**2+(y-y_mean)**2)/alpha**2))**beta)
    return moff.ravel()

def fitCircularMoffat(data,initParams={}):
    """
    Fits a 2d numpy array to a symmetric Moffat distribution
    
    Parameters
    ----------
    data: 2D numpy array
        image data
    
    Returns
    -------
    fitResult: 2D numpy array
        list of best fit parameters in a form given by src_dtypes['circular moffat']
    pcov: 2D numpy array
        Covariant matrix that describes the error in the fit (but in an 'unscientific' way).
        This needs to be improved to get accurate error estimates
    """
    
    x=np.linspace(0,data.shape[0]-1,data.shape[0])
    y=np.linspace(0,data.shape[1]-1,data.shape[1])
    x,y=np.meshgrid(x, y)
    
    # Guess initial parameters
    floor=np.ma.median(data.flatten())
    height=data.max()-floor
    x_mean=data.shape[0]/2
    y_mean=data.shape[1]/2
    fwhm=np.sqrt(np.sum((data>floor+height/2.).flatten()))
    beta=3.5
    alpha = 0.5*fwhm/np.sqrt(2.**(1./beta)-1.)
    initialGuess=(x_mean,y_mean,beta,alpha,height,floor)
    
    # Attempt fit and return empty lists if it does not converge
    try:
        fitResult,pcov=curve_fit(circularMoffat,(x,y),data.ravel(),p0=initialGuess)
    except RuntimeError:
        return [],[]
    # Convert alpha into a FWHM
    fitResult[3]=np.sqrt(2.**(1./beta)-1.)*fitResult[3]*2
    return fitResult,pcov

def ellipticalMoffat((x,y),x_mean,y_mean,alpha1,alpha2,beta,angle,height,floor):
    """
    Uses 2d array of data to calculate a moffat distribution at the point (x,y), then flattens the data
    into a 1d array for processing.
    
    Parameters
    ----------
    (x,y): tuple of 2D numpy arrays
        Grid of points used to calculate the value of the function
        example:x=np.linspace(0,width-1,width)
                y=np.linspace(0,height-1,height)
                x,y=np.meshgrid(x, y)
    x_mean,y_mean: floats
        location of the maximum (or peak) of the distribution
    alpha1,alpha2,beta: floats
        parameters that describe the shape of a moffat distribution
    angle: float
        describes the rotation angle
    floor: float
        lowest asymptotic point of the distribution
    height: float
        maximum height of the distribution above the floor
    
    Returns
    -------
    moff.ravel(): 1D numpy array
        Value of the distribution for the given set of parameters, flattened into a 1D array
        so that it can be used with the curve_fit function
    """
    A = (np.cos(angle)/alpha1)**2. + (np.sin(angle)/alpha2)**2.
    B = (np.sin(angle)/alpha1)**2. + (np.cos(angle)/alpha2)**2.
    C = 2.0*np.sin(angle)*np.cos(angle)*(1./alpha1**2. - 1./alpha2**2.)
    moff=floor + height/((1.+ A*((x-x_mean)**2) + B*((y-y_mean)**2) + C*(x-x_mean)*(y-y_mean))**beta)
    return moff.ravel()

def fitEllipticalMoffat(data):
    """
    Fits a 2d numpy array to a symmetric Moffat distribution
    
    Parameters
    ----------
    data: 2D numpy array
        image data
    
    Returns
    -------
    fitResult: 2D numpy array
        list of best fit parameters in a form given by src_dtypes['elliptical moffat']
    pcov: 2D numpy array
        Covariant matrix that describes the error in the fit (but in an 'unscientific' way).
        This needs to be improved to get accurate error estimates
    """
    
    x=np.linspace(0,data.shape[0]-1,data.shape[0])
    y=np.linspace(0,data.shape[1]-1,data.shape[1])
    x,y=np.meshgrid(x, y)
    
    # Generate initial guess
    floor=np.ma.median(data.flatten())
    height=data.max()-floor
    x_mean=data.shape[0]/2
    y_mean=data.shape[1]/2
    fwhm=np.sqrt(np.sum((data>floor+height/2.).flatten()))
    beta=3.5
    alpha1 = 0.5*fwhm/np.sqrt(2.**(1./beta)-1.)
    alpha2 = 0.5*fwhm/np.sqrt(2.**(1./beta)-1.)
    angle=0
    initialGuess=(x_mean,y_mean,alpha1,alpha2,beta,angle,height,floor)
    
    # Attempt fit and return empty lists if it does not converge
    try:
        fitResult,pcov=curve_fit(ellipticalMoffat,(x,y),data.ravel(),p0=initialGuess)
    except RuntimeError:
        # Fit did not converge
        return [],[]
    
    # Convert alpha 1 and 2 into FWHM measurements
    fitResult[3]=np.sqrt(2.**(1./beta)-1.)*fitResult[3]*2
    fitResult[4]=np.sqrt(2.**(1./beta)-1.)*fitResult[4]*2
    return fitResult,pcov

# Map fit types to function defined above
fit_types={
    'circular moffat':fitCircularMoffat,
    'elliptical moffat':fitEllipticalMoffat,
    'circular gaussian':None,
    'elliptical gaussian':None,
    'no fit':None
}

def findStars(imgData,apertureType='radius',maxima_size=5,maxima_sigma=2,maxima_footprint=None,aperture_radii=[],threshold=None,
                saturate=None,margin=None,binStruct=None,fit_method='elliptical moffat',id=None):
    """
    Detect possible sources in an image and attempt to fit them to a specified profile.
    
    Parameters
    ----------
    imgData: 2D numpy array
        Image data
    apertureType: string
        Type of aperture to use when searching for local maxima. The options are:
            'width': square with width specified by maxima_size
            'radius': circule with radius specified by maxima_size
            'footprint': binary structure with 1's representing 
    maxima_size: int,optional
        Either width of the area or the radius of a circle in which to search for a maximum (for each point)
    maxima_footprint: numpy 2D array (dtype=boolean),optional
        Instead of supplying a size, a footprint can be given of a different shape to use for finding a footprint
            example:
                footprint=np.array([
                    [0,0,1,0,0],
                    [0,1,1,1,0],
                    [1,1,1,1,1],
                    [0,1,1,1,0],
                    [0,0,1,0,0]
                ])
            The above example would only seach for a maximum in the pixels labeled by 1 in the region
            centered on a given pixel
    aperture_radii: list,optional
        List of radii to use to fit the source. In general this should be 5 times the fwhm of the source.
    threshold: float,optional
        Minimum pixel value above the background noise
    saturate: float, optional
        Value at which CCD's for the detector become saturated and are no longer linear
    margin: int, optional
        Sources close to the edges can be cut off to prevent partial data from becoming mixed up with good detections
    binStruct: 2d numpy array, optional
        Minimum structure that regions of the image are shrunk down to in order to isolate maxima
    fit_method: str
        Type of fit to use to get centroid positions and approximate photometric parameters.
        This step can be skipped by choosing fit_method='no fit'.
    
    Returns
    -------
    best_fits: numpy structured array
        Structured array based on the fit method chosen (given by the fit_dtypes dict).
    no_fit: numpy structured array
        x and y coordinates of sources that could not be fit
    """
    from astro_pypelines.utils.fitting_tools import fit_elliptical_moffat
    
    # Estimate the background by assuming that the middle 80% of the pixels in the image are background
    if threshold is None:
        sorted_data=np.sort(imgData.flatten())
        back_min_idx=int(sorted_data.size*0.1)
        back_max_idx=int(sorted_data.size*0.9)
        back_estimate=sorted_data[back_min_idx:back_max_idx]
        back_mean=np.mean(back_estimate)
        back_median=np.median(back_estimate)
        back_std=np.std(back_estimate)
        back_min=back_estimate[0]
        back_max=back_estimate[-1]
        threshold=max(abs(back_mean-back_min),abs(back_max-back_mean))
        
        info='\n'.join([
            'Backround estimate minimum:'+str(back_min),
            'Background estimate maximum:'+str(back_max),
            'median:'+str(back_median),
            'mean:'+str(back_mean),
            'standard deviation'+str(back_std),
            'threshold:'+str(threshold)
        ])
        
        if id is None:
            print(id)
        else:
            core.progress_log(info,id)
    
    # Find all the point sources and their approximate positions
    sources=detectSources(imgData,threshold,apertureType,maxima_size,maxima_footprint,binStruct,maxima_sigma,saturate,margin)
    srcIndices=np.where(sources)
    if id is None:
        print('Number of stars:',srcIndices[0].size)
    else:
        core.progress_log('Number of stars: '+str(srcIndices[0].size),id)
    
    # Fit the sources to a valid fit method. 
    if fit_method not in fit_types.keys():
        raise core.AstropypError("Invalid fit method, please choose from '"+"','".join(fit_types))
    
    import time
    t1 = time.time()
    best_fits = fit_elliptical_moffat(imgData.astype('float64'), 
                    srcIndices[1].astype('int32'), 
                    srcIndices[0].astype('int32'), 
                    aperture_radii[0],threshold)
    best_fits=best_fits.view(dtype=fit_dtypes['fast'])
    no_fit=[]
    t2=time.time()
    print('fit {0} objects in {1}s'.format(len(best_fits), t2-t1))
    
    return [best_fits,no_fit]

def findStars_old(imgData,apertureType='radius',maxima_size=5,maxima_sigma=2,maxima_footprint=None,aperture_radii=[],threshold=None,
                saturate=None,margin=None,binStruct=None,fit_method='elliptical moffat',id=None):
    """
    Detect possible sources in an image and attempt to fit them to a specified profile.
    
    Parameters
    ----------
    imgData: 2D numpy array
        Image data
    apertureType: string
        Type of aperture to use when searching for local maxima. The options are:
            'width': square with width specified by maxima_size
            'radius': circule with radius specified by maxima_size
            'footprint': binary structure with 1's representing 
    maxima_size: int,optional
        Either width of the area or the radius of a circle in which to search for a maximum (for each point)
    maxima_footprint: numpy 2D array (dtype=boolean),optional
        Instead of supplying a size, a footprint can be given of a different shape to use for finding a footprint
            example:
                footprint=np.array([
                    [0,0,1,0,0],
                    [0,1,1,1,0],
                    [1,1,1,1,1],
                    [0,1,1,1,0],
                    [0,0,1,0,0]
                ])
            The above example would only seach for a maximum in the pixels labeled by 1 in the region
            centered on a given pixel
    aperture_radii: list,optional
        List of radii to use to fit the source. In general this should be 5 times the fwhm of the source.
    threshold: float,optional
        Minimum pixel value above the background noise
    saturate: float, optional
        Value at which CCD's for the detector become saturated and are no longer linear
    margin: int, optional
        Sources close to the edges can be cut off to prevent partial data from becoming mixed up with good detections
    binStruct: 2d numpy array, optional
        Minimum structure that regions of the image are shrunk down to in order to isolate maxima
    fit_method: str
        Type of fit to use to get centroid positions and approximate photometric parameters.
        This step can be skipped by choosing fit_method='no fit'.
    
    Returns
    -------
    best_fits: numpy structured array
        Structured array based on the fit method chosen (given by the fit_dtypes dict).
    no_fit: numpy structured array
        x and y coordinates of sources that could not be fit
    """
    
    # Estimate the background by assuming that the middle 80% of the pixels in the image are background
    if threshold is None:
        sorted_data=np.sort(imgData.flatten())
        back_min_idx=int(sorted_data.size*0.1)
        back_max_idx=int(sorted_data.size*0.9)
        back_estimate=sorted_data[back_min_idx:back_max_idx]
        back_mean=np.mean(back_estimate)
        back_median=np.median(back_estimate)
        back_std=np.std(back_estimate)
        back_min=back_estimate[0]
        back_max=back_estimate[-1]
        threshold=max(abs(back_mean-back_min),abs(back_max-back_mean))
        
        info='\n'.join([
            'Backround estimate minimum:'+str(back_min),
            'Background estimate maximum:'+str(back_max),
            'median:'+str(back_median),
            'mean:'+str(back_mean),
            'standard deviation'+str(back_std),
            'threshold:'+str(threshold)
        ])
        
        if id is None:
            print(id)
        else:
            core.progress_log(info,id)
    
    # Find all the point sources and their approximate positions
    sources=detectSources(imgData,threshold,apertureType,maxima_size,maxima_footprint,binStruct,maxima_sigma,saturate,margin)
    srcIndices=np.where(sources)
    if id is None:
        print('Number of stars:',srcIndices[0].size)
    else:
        core.progress_log('Number of stars: '+str(srcIndices[0].size),id)
    
    # Fit the sources to a valid fit method. 
    if fit_method not in fit_types.keys():
        raise core.AstropypError("Invalid fit method, please choose from '"+"','".join(fit_types))
    best_fits=np.array([],dtype=fit_dtypes[fit_method])
    
    if fit_method!='no fit':
        if id is None:
            print('Fitting points')
        else:
            core.progress_log('Fitting points',id)
        fit_func=fit_types[fit_method]
        step=0
        if len(aperture_radii)==0:
            step=int(maxima_size*3/4)
        else:
            step=aperture_radii[0]
        no_fit=np.array([],dtype=fit_dtypes['no fit'])
        for i in range(len(srcIndices[0])):
            x=srcIndices[1][i]
            y=srcIndices[0][i]
            xMin=max(x-step,0)
            xMax=min(x+step+1,imgData.shape[1])
            yMin=max(y-step,0)
            yMax=min(y+step+1,imgData.shape[0])
            best_fit,pcov=fit_func(imgData[yMin:yMax,xMin:xMax])
            if len(best_fit)>0:
                best_fit=np.array([tuple(best_fit)],dtype=fit_dtypes[fit_method])
                best_fit['x']=best_fit['x']+xMin
                best_fit['y']=best_fit['y']+yMin
                best_fits=np.hstack((best_fits,best_fit))
            else:
                no_fit=np.hstack((no_fit,np.array([tuple((srcIndices[1][i],srcIndices[0][i]))],dtype=fit_dtypes['no fit'])))
    else:
        best_fits=np.empty(len(srcIndices[1]),dtype=fit_dtypes['no fit'])
        best_fits['x']=srcIndices[1]
        best_fits['y']=srcIndices[0]
        no_fit=np.array([],dtype=fit_dtypes['no fit'])
    
    
    return [best_fits,no_fit]