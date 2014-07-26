from __future__ import division, print_function

import numpy as np
from six import string_types

import astropy.io.fits as pyfits
import astropy.units as u
from astropy.table import Table, Column, vstack
from astropy import coordinates as coords
import astropy.wcs as pywcs
from astroquery.sdss import SDSS
from astroquery.vizier import Vizier
from photutils.detection.lacosmic import lacosmic
#from photutils import CircularAperture, CircularAnnulus, aperture_photometry
import photutils

from .detect_sources import findStars

__all__ = ['cosmic_reject', 'cosmic_reject_pyp', 'frame_phot', 'image_phot', 'calc_frame_phot_correction',
    'calc_image_phot_correction', 'std_plots']

catalog_info = {
    'SDSS': {
        'vizier name': 'V/139',
        'class': {
            'known': 0,
            'cosmic ray': 1,
            'defect': 2,
            'galaxy': 3,
            'ghost': 4,
            'known obj': 5,
            'star': 6,
            'trail': 7,
            'sky': 8,
            'not a type': 9
        },
        'mode': 'mode',
        'modes': {
            'primary': 1,
            'secondary': 2
        }
    },
    'UKIDSS': {
        'vizier name': 'II/319',
        'class': {
            'probable galaxy': -3,
            'probable star': -2,
            'star': -1,
            'noise': 0,
            'galaxy': 1
        },
        'mode': 'm',
        'modes': {
            'primary': 1,
            'secondary': 2
        }
    }
}

def modify_filename(filename, new_field, separator='.', section=0):
    filename_split = filename.split(separator)
    filename_split[section] += new_field
    new_filename = separator.join(filename_split)
    return new_filename

def cosmic_reject(filename, hdulist=None, frames=None, params={}):
    if hdulist is None:
        hdulist = pyfits.open(filename)
    parameters={
        'contrast': .5,
        'cr_threshold': 1,
        'neighbor_threshold': .1,
        'gain': 0.1,
        'readnoise': 11.12,
        'maxiter': 4
    }
    parameters.update(params)
    
    for frame in frames:
        hdu = hdulist[frame]
        if (isinstance(hdu, pyfits.hdu.image.ImageHDU) or 
                isinstance(hdu, pyfits.hdu.compressed.CompImageHDU) or
                len(hdulist)==1):
            print('frame:', frame)
            data=hdu.data.astype(np.float)
            parameters['image'] = data
            result = lacosmic(**parameters)
            hdu.data=result[0].astype(hdulist[2].data.dtype)
            filename_split = filename.split('.')
            filename_split[0] += '-rejected'
            new_filename = '.'.join(filename_split)
            print('new filename:', new_filename)
    hdulist.writeto(new_filename, clobber=True)
    return hdulist

def cosmic_reject_pyp(id, params):
    import fitsviewer
    if 'frames' in params:
        frames = params['frames']
    else:
        frames = range(len(hdulist))
    hdulist = fitsviewer.getHDUlist(params)
    try:
        cosmic_reject(params['filename'], hdulist, frames, params['lacosmic_params'])
    except Exception:
        raise JobError('Error rejecting cosmic rays')
    response = {
        'id': 'cosmic reject',
        'status': 'success'
    }
    return response

def frame_phot(hdu, cat_objects, phot_file, filter_name, exp_time, mag_zero=0,
                aperture_radius=5, annulus_radius=None, cut_vars={}):
    print('total objects:',len(cat_objects))
    for key, cut_var in cut_vars.items():
        cat_objects = cat_objects[(cat_objects[key]>cut_var['min']) & 
                                    (cat_objects[key]<cut_var['max'])]
    print('good objects:', len(cat_objects))
    cat_objects = Table(cat_objects)

    aperture_area = np.pi * aperture_radius**2
    if annulus_radius is None:
        annulus_radius = aperture_radius+2
    annulus_area = np.pi * (annulus_radius**2 - aperture_radius**2)

    objects = zip(cat_objects['x'],cat_objects['y'])
    apertures = photutils.CircularAperture(objects, aperture_radius)
    annulus_apertures = photutils.CircularAnnulus(objects, aperture_radius, annulus_radius)
    flux = photutils.aperture_photometry(hdu.data, apertures)
    bkg_flux = photutils.aperture_photometry(hdu.data, annulus_apertures)
    
    total_flux = flux-bkg_flux*aperture_area/annulus_area
    instrumental_mag = mag_zero - (2.5*np.log10(total_flux/exp_time))
    cat_objects[filter_name] = instrumental_mag
    cat_array=np.array(cat_objects)
    np.save(phot_file, cat_array)
    return cat_objects

def image_phot(hdulist, new_cat_file, filter_name, exp_time, frames=None, cat_files=None, 
            aperture_radius=5, annulus_radius=None, cut_vars={}, mag_zero=0,
            catalog_params=None, calc_wcs=True):
    if cat_files is None and catalog_params is None:
        err_msg='Must either supply a list of catalog filenames or parameters to detect objects'
        raise jobs.JobError(err_msg)
    if frames is None:
        frames = range(len(hdulist))
    catalogs = {}
    for frame in frames:
        print('frame:', frame)
        hdu = hdulist[frame]
        if (isinstance(hdu, pyfits.hdu.image.ImageHDU) or len(hdulist)==1 or
                            isinstance(hdu, pyfits.hdu.compressed.CompImageHDU)):
            if catalog_params is not None:
                print('Detecting sources')
                cat_objects,bad_sources = findStars(hdu.data, **catalog_params)
                cat_objects = Table(cat_objects)
                if calc_wcs:
                    wcs = pywcs.WCS(hdu.header)
                    world = wcs.all_pix2world(cat_objects['x'],cat_objects['y'],1)
                    ra = world[0]
                    dec = world[1]
                    cat_objects['ra'] = ra
                    cat_objects['dec'] = dec
            else:
                cat_objects=np.load(cat_files[str(frame)])
            phot_file = modify_filename(new_cat_file, '-'+str(frame))
            catalogs[str(frame)] = frame_phot(
                hdu, 
                cat_objects, 
                phot_file, 
                filter_name, 
                exp_time, 
                mag_zero, 
                aperture_radius, 
                annulus_radius, 
                cut_vars
            )
            print('file generated for frame {0}: {1}\n'.format(frame, phot_file))
    return catalogs

def calc_frame_phot_correction(objects, cat_file, vizier_var, phot_var, cat_name='SDSS', 
                                separation=2*u.arcsec, fields=['*']):
    positions = coords.SkyCoord(objects['ra'], objects['dec'], frame='icrs', unit='deg')
    
    print('Querying Vizier')
    v_cat = Vizier(columns=fields, catalog=catalog_info[cat_name]['vizier name'])
    result = v_cat.query_region(positions, radius=separation)
    # Vizier returns a table list with a table for each catalog
    # Since we have only chosen one catalog, we take the first (and only) table
    catalog = result[0] 
    catalog.rename_column('_RAJ2000','ra')
    catalog.rename_column('_DEJ2000','dec')
    catalog.rename_column(vizier_var, phot_var)
    # remove results that have bad photometry
    #catalog = catalog[catalog[phot_var]>-9000]
    
    # only keep the catalog entries that are primary stars
    catalog = catalog[catalog['cl']==catalog_info[cat_name]['class']['star']]
    catalog = (catalog[catalog[catalog_info[cat_name]['mode']] ==
                        catalog_info[cat_name]['modes']['primary']])

    print('Finding matches for catalog stars')
    # find the corresonding object for each entry in the catalog array
    dr = coords.Angle(separation).to('degree').value
    cat_coords = coords.SkyCoord(catalog['ra'], catalog['dec'], frame='icrs', unit='deg')
    matches, d2d, d3d = cat_coords.match_to_catalog_sky(positions)
    match_col = Column(matches)
    catalog['matches'] = match_col
    catalog = catalog.group_by('matches')
    print('Total matches:', len(catalog.groups.keys['matches']))
    
    cat_array=np.array(catalog)
    np.save(cat_file, cat_array)
    print('Saving file',cat_file)
    return catalog

def calc_image_phot_correction(objects, hdulist, new_cat_file, phot_var, vizier_var,
        cat_name='SDSS', separation=2*u.arcsec, fields=[], frames=None
    ):
    if frames is None:
        frames = range(len(hdulist))
    catalogs = {}
    for n, frame in enumerate(frames):
        print('frame:', frame)
        hdu = hdulist[frame]
        if (isinstance(hdu, pyfits.hdu.image.ImageHDU) or len(hdulist)==1 or
            isinstance(hdu, pyfits.hdu.compressed.CompImageHDU)
        ):
            cat_file = modify_filename(new_cat_file, '-'+str(frame))
            catalog = calc_frame_phot_correction(
                objects[str(frame)],
                cat_file,
                vizier_var,
                phot_var,
                cat_name, 
                separation, 
                fields
            )
            catalogs[str(frame)] = catalog
            matches = catalog.groups.keys['matches']
            diff = objects[str(frame)][matches][phot_var]-catalog[phot_var]
            
            #group_mean = catalog.groups.aggregate(np.mean)
            #matches = catalog.groups.keys['matches']
            #diff = objects[n][matches][phot_var]-group_mean[phot_var]
            
            diff = diff[~np.isnan(diff)]
            diff_mean = np.mean(diff)
            diff_median = np.median(diff)
            print('mean:', diff_mean)
            print('median:', diff_median)
            print('file generated for frame {0}: {1}\n'.format(frame, cat_file))
            
    return catalogs

def std_plots(objects, catalog, plot_file, filter_name):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    #group_mean = catalog.groups.aggregate(np.mean)
    #group_std = catalog.groups.aggregate(np.std)
    
    #std_z = group_std[filter_name].group_by(np.zeros(len(group_std[filter_name])))
    #mean_std_z = group_std[filter_name].groups.aggregate(np.mean)
    #std_std_z = group_std[filter_name].groups.aggregate(np.std)
    #print('mean std:', mean_std_z)
    #print('std std', std_std_z)
    #print('median std:', group_std[filter_name].groups.aggregate(np.median))
    
    diff = objects[catalog.groups.keys['matches']][filter_name]-catalog[filter_name]
    
    #plt.hist(std_z)
    #plt.title("Standard Deviation of all {0} magnitudes".format(filter_name))
    #plt.xlabel("Value")
    #plt.ylabel("Frequency")
    #plt.savefig(modify_filename(plot_file, '-std'))
    #plt.close()
    
    plt.hist(diff[~np.isnan(diff)], bins=30)
    plt.title("Difference from instrumental {0} and SDSS {0}".format(filter_name))
    plt.xlabel("Value")
    plt.ylabel("Frequency")
    plt.savefig(modify_filename(plot_file, '-diff'))
    plt.close()
    
    order = catalog.argsort(filter_name)
    plt.plot(catalog[order][filter_name], diff[order])
    plt.title("SDSS {0} vs Difference".format(filter_name))
    plt.xlabel("SDSS {0}".format(filter_name))
    plt.ylabel("SDSS {0} - instr {0}".format(filter_name))
    plt.savefig(modify_filename(plot_file, '-cor'))
    plt.close()
