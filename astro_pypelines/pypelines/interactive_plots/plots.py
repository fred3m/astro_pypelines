from __future__ import division, print_function
import os
import numpy as np
from astropy.table import Table

def load_table(id, params):
    catalog = Table.read(params['filename'], format= 'ascii');
    response = {
        'id': 'plot table',
        'columns': catalog.dtype.names,
        'data': [np.array(record).tolist() for record in catalog],
        'title': params['filename']
    }
    return response