from __future__ import division, print_function
import os
import numpy as np
from astropy.table import Table
from astropy.modeling import models, fitting

fit_types = {
    'linearLSQ': fitting.LinearLSQFitter(),
    'levMarLSQ': fitting.LevMarLSQFitter(),
    'SLSQPLSQ': fitting.SLSQPLSQFitter(),
    'simplexLSQ': fitting.SimplexLSQFitter()
}

def load_table(id, params):
    if params['format'] == 'npy':
        catalog = np.load(params['filename'])
    else:
        catalog = Table.read(params['filename'], format= params['format']);
    response = {
        'id': 'plot table',
        'columns': catalog.dtype.names,
        'data': [np.array(record).tolist() for record in catalog],
        'title': os.path.basename(params['filename'])
    }
    return response

def fit_data1d(id, params):
    fit_type = fit_types[params['fit_type']]
    if params['model'] == 'polynomial':
        fit = models.Polynomial1D(params['order'])
        coefficients = params['coefficients'].split(',')
        coefficients = [float(coeff.strip()) for coeff in coefficients]
        for i in range(params['order']+1):
            coeff = 'c'+str(i)
            setattr(fit, coeff, coefficients[i])
    elif params['model'] == 'gaussian':
        fit = models.Gaussian1D(amplitude=params['amplitude'], mean=params['mean'],
                                stddev=params['std_dev'])
    best_fit = fit_type(fit, params['x'], params['y'])
    
    diff = best_fit(params['x'])-params['y']
    mean_sq_err = 1/len(params['x'])*np.sum(diff**2)
    rms_dev = np.sqrt(mean_sq_err)
    parameters = {}
    for n in range(len(best_fit._parameters)):
        parameters[best_fit.param_names[n]] = best_fit._parameters[n]
    array_x = np.array(params['x'])
    model_x = np.linspace(np.amin(array_x), np.amax(array_x),30)
    model_y = best_fit(model_x)
    model_data = zip(model_x.tolist(),model_y.tolist())
    response = {
        'id': 'best fit',
        'model': params['model'],
        'parameters': parameters,
        'columns': ['model_x', 'model_y'],
        'data': model_data,
        'title': 'fit',
        'rms_dev': rms_dev
    }
    return response
        