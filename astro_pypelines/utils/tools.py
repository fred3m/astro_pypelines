# tools.py
# Universal tools for all pypelines
# Copyright 2014 by Fred Moolekamp
# License: BSD 3 clause

from __future__ import division,print_function
import os
import numpy as np
import math
from scipy.optimize import curve_fit
import json

# astropyp imports
from astropyp.utils import core

def gaussian(x,amplitude,mean,stdDev):
    return amplitude*np.exp(-(x-mean)**2/(2*stdDev**2))

def gaussian2d((x,y),amplitude,x_mean,y_mean,sigma_x,sigma_y,theta):
    a=(np.cos(theta)**2)/(2*sigma_x**2)+(np.sin(theta)**2)/(2*sigma_y**2)
    b=-(np.sin(2*theta))/(4*sigma_x**2)+(np.sin(2*theta))/(4*sigma_y**2)
    c=(np.sin(theta)**2)/(2*sigma_x**2)+(np.cos(theta)**2)/(2*sigma_y**2)
    gauss=amplitude*np.exp(-(a*(x-x_mean)**2+2*b*(x-x_mean)*(y-y_mean)+c*(y-y_mean)**2))
    return gauss.ravel()

def getGaussFit(id,params):
    core.check4key(params,['data'])
    data=np.array(params['data'])
    x=np.array([d[0] for d in data])
    y=np.array([d[1] for d in data])
    moments,uncertain=curve_fit(gaussian,x,y,sigma=1)
    print("1D Gaussian fit:",moments,uncertain)
    response={
        'id':'gauss moments',
        'amplitude':moments[0],
        'mean':moments[1],
        'stdDev':moments[2],
        'amplitude2':moments[0],
        'mean2':moments[1],
        'stdDev2':moments[2],
    }
    return response

def getGaussFit2d(id,params):
    core.check4key(params,['data'])
    data=np.array(params['data'])
    x=np.linspace(0,data.shape[0]-1,data.shape[0])
    y=np.linspace(0,data.shape[1]-1,data.shape[1])
    gauss=data
    x,y=np.meshgrid(x, y)
    amplitude=np.amax(data)
    x_mean=data.shape[0]/2
    y_mean=data.shape[1]/2
    sigma_x=15
    sigma_y=15
    theta=0
    initialGuess=(amplitude,x_mean,y_mean,sigma_x,sigma_y,theta)
    moments,uncertain=curve_fit(gaussian2d,(x,y),gauss.ravel(),p0=initialGuess)
    momentLabels=['amplitude','x_mean','y_mean','sigma_x','sigma_y','theta']
    momentDict={momentLabels[i]:moments[i] for i in range(moments.shape[0])}
    momentDict['fwhm_x']=2.35482*momentDict['sigma_x']
    momentDict['fwhm_y']=2.35482*momentDict['sigma_y']
    response={
        'id':'gauss moments',
        'moments':momentDict
    }
    return response

def getDataStats(id,params):
    core.check4key(params,['data','stats'])
    data=np.array(params['data'])
    response={'id':'data stats'}
    for stat in params['stats']:
        if stat=='mean':
            response['mean']=data.mean()
        elif stat=='stdDev':
            response['stdDev']=data.std()
        elif stat=='variance':
            response['variance']=data.var()
        elif stat=='sum':
            response['sum']=data.sum()
        elif stat=='median':
            response['median']=np.median(data)
        elif stat=='minimum':
            response['minimum']=data.amin()
        elif stat=='maximum':
            response['maximum']=data.amax()
    return response

def deg2sex(x):
    y=abs(x)
    sex={
        'deg':int(math.floor(y))
    }
    sign=1
    if x<0:
        sign=-1
    sex['min']=int(math.floor((y-sex['deg'])*60))
    sex['sec']=(y-sex['deg']-sex['min']/60)*3600
    sex['deg']*=sign
    return sex

def deg2ra(x):
    ra=deg2sex(x/15)
    ra['hr']=int(ra['deg'])
    ra['deg']=int(math.floor(x))
    return ra

def sex2deg(sex):
    sign=1
    if sex['deg']<0:
        sign=-1
    return sign*(abs(sex['deg'])+sex['min']/60+sex['sec']/3600)

def ra2deg(sex):
    sign=1
    if sex['hr']<0:
        sign=-1
    return sign*(abs(sex['hr']*15)+sex['min']/60+sex['sec']/3600)

def isJSON(obj):
    try:
        myJSON=json.dumps(obj)
    except TypeError as jError:
        return False
    return True

def isNumber(x):
    try:
        float(x)
        return True
    except ValueError:
        return False

def npViewFields(npArray,fields):
    dtype2=np.dtype({name:npArray.dtype.fields[name] for name in fields})
    return np.ndarray(npArray.shape,dtype2,npArray,0,npArray.strides)