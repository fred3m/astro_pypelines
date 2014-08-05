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
        'template_name': 'color-mag.html',
        'template_path': [pypeline_dir, 'photometry', 'templates']
    }),
    (r"/template", BaseHandler, {
        'template_name': 'template.html',
        'template_path': [pypeline_dir, 'pypeline-template', 'templates']
    }),
    (r"/scatter", BaseHandler, {
        'template_name': 'scatter.html',
        'template_path': [pypeline_dir, 'interactive_plots', 'templates']
    }),
    (r"/plots", BaseHandler, {
        'template_name': 'plots.html',
        'template_path': [pypeline_dir, 'interactive_plots', 'templates']
    }),
]