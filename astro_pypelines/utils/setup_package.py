# Licensed under a 3-clause BSD style license - see PYFITS.rst

import os

from distutils.core import Extension
from glob import glob

from astropy_helpers import setup_helpers

def get_extensions():
    cfg = setup_helpers.DistutilsExtensionArgs()
    cfg['sources'].extend(
        os.path.relpath(fname) for fname in
        glob(os.path.join(os.path.dirname(__file__), 'src', '*.c')))

    return [Extension('astro_pypelines.utils.fitting_tools', **cfg)]