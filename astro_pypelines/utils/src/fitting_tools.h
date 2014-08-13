// Heading for Astro Pypeline Fitting Tools

#include "Python.h"
#include "numpy/arrayobject.h"
#include "mpfit.h"

#ifndef FITTING_CTOOLS_H
#define FITTING_CTOOLS_H

#define NBR_PARAMS 8

struct elliptical_moffat_vars {
    double *img_data;
    int *x;
    int *y;
    int width;
    int height;
};

int elliptical_moffat_fit(double *img_data, int img_length, int *x, int *y, int width, 
        int height, double *init_params, mp_result *result, double threshold);

// Python Interface Functions //
static PyObject *fitting_tools_fit_elliptical_moffat(PyObject *self, PyObject *args);

// Function from Scipy cookbook to make conversion from numpy to C easier
// http://wiki.scipy.org/Cookbook/C_Extensions/NumPy_arrays
double *nparray_to_double_2Darray(PyArrayObject *arrayin);
int *nparray_to_int_array(PyArrayObject *arrayin);
double **ptrvector(long n);

#endif