from __future__ import division, print_function
from astropyp.web_server.web_utils import BaseHandler
import os

#pypeline_dir = os.path.abspath(os.path.join(os.path.dirname(__file__),os.pardir,'pypelines'))
pypeline_dir = os.path.abspath(os.path.join(os.path.dirname(__file__),'pypelines'))
print('pypeline_dir:',pypeline_dir)

pypeline_handlers = [
    (r"/fitsviewer", BaseHandler, {
        'template_name': 'fitsviewer.html',
        'template_path': [pypeline_dir, 'fitsviewer', 'templates']
    }),
    (r"/color-mag", BaseHandler, {
        'template_name': 'colormag.html',
        'template_path': [pypeline_dir, 'photometry', 'templates']
    })
]