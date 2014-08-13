// _fitting_tools.c
// Interface to connect Astro Pypeline C++ fitting tools functions with Python
// 2014 by Fred Moolekamp

#include "Python.h"
#include "stdio.h"
#include "stdlib.h"
#include "numpy/arrayobject.h"
#include "fitting_tools.h"
#include "mpfit.h"

/* ==== Allocate a double *vector (vec of pointers) ======================
     Memory is Allocated!  See void free_Carray(double ** )                  */
// Taken from Scipy Cookbook: http://wiki.scipy.org/Cookbook/C_Extensions/NumPy_arrays
double **ptrvector(long n)  {
    double **v;
    v=(double **)malloc((size_t) (n*sizeof(double)));
    if (!v)   {
        printf("In **ptrvector. Allocation of memory for double array failed.");
        exit(0);
    };
    return v;
};

/* ==== Free a double *vector (vec of pointers) ========================== */ 
// Taken from Scipy Cookbook: http://wiki.scipy.org/Cookbook/C_Extensions/NumPy_arrays
void free_Carrayptrs(double **v)  {
    free((char*) v);
};

// Taken from Scipy Cookbook: http://wiki.scipy.org/Cookbook/C_Extensions/NumPy_arrays
double *nparray_to_double_2Darray(PyArrayObject *arrayin){
    double **c, *a;
    int n,m;
    n = arrayin->dimensions[0];
    m = arrayin->dimensions[1];
    c = ptrvector(n);
    a = (double *) arrayin->data;
    for(int i=0; i<n; i++){
        c[i]=a+i*m;
    };
    return c;
};

// Taken from Scipy Cookbook: http://wiki.scipy.org/Cookbook/C_Extensions/NumPy_arrays
int *nparray_to_int_array(PyArrayObject *arrayin){
    return (int *) arrayin->data;
};

static PyObject *fitting_tools_fit_elliptical_moffat(PyObject *self, PyObject *args){
    // variables from python
    PyArrayObject *img_data_py, *x_cm_py, *y_cm_py, *obj_array_py;
    double **img_data, **obj_array;
    int *x_cm, *y_cm;
    int aperture_radius, obj_array_dims[2];
    double threshold;
    
    // local image variable
    double *local_data;
    int *x;
    int *y;
    int img_data_height, img_data_width, nbr_objs, x0, xf, y0, yf;
    int local_width, local_height, aperture_width, allocated_width, allocated_height;
    double local_min, local_max;
    
    // mpfit variables
    int status;
    double params[NBR_PARAMS];
    mp_result result;
    memset(&result,0,sizeof(result));       /* Zero results structure */
    
    // return variables
    double **objects;
    
    // Load parameters from python
    if(!PyArg_ParseTuple(args,"O!O!O!id",&PyArray_Type, &img_data_py,
                &PyArray_Type, &x_cm_py, &PyArray_Type, &y_cm_py, &aperture_radius, &threshold)){
        return NULL;
    };
    
    if (NULL == img_data_py) return NULL;
    if (NULL == x_cm_py) return NULL;
    if (NULL == y_cm_py) return NULL;
    
    // Allocate memory for the array pointers
    // This will be reallocated for each 
    aperture_width = 2*aperture_radius+1;
    local_data = (double *) malloc(aperture_width*aperture_width*sizeof(double));
    x = (int *) malloc(aperture_width*sizeof(int));
    y = (int *) malloc(aperture_width*sizeof(int));
    allocated_width = aperture_width;
    allocated_height = aperture_width;
    
    img_data = nparray_to_double_2Darray(img_data_py);
    x_cm = nparray_to_int_array(x_cm_py);
    y_cm = nparray_to_int_array(y_cm_py);
    
    img_data_width = img_data_py->dimensions[1];
    img_data_height = img_data_py->dimensions[0];
    nbr_objs = x_cm_py->dimensions[0];
    
    objects = malloc(nbr_objs * sizeof(double *));
    for (int i=0; i<nbr_objs; i++)
      objects[i] = malloc((NBR_PARAMS+1)*sizeof(double));
    
    // perform fitting for each object
    for(int i=0; i<nbr_objs; i++){
        // Find the bounds of the local data to fit
        if(*x_cm > aperture_radius){
            x0 = *x_cm-aperture_radius;
        } else {
            x0 = 0;
        };
        if(*y_cm > aperture_radius){
            y0 = *y_cm-aperture_radius;
        } else{
            y0=0;
        };
        if(*x_cm+aperture_radius < img_data_width){
            xf = *x_cm+aperture_radius;
        } else {
            xf = img_data_width;
        };
        if(*y_cm+aperture_radius < img_data_height){
            yf = *y_cm+aperture_radius;
        } else {
            yf = img_data_height;
        };
        
        // Build x and y axes of the local image and
        // reallocate memory (if necessary)
        local_width = xf-x0+1;
        local_height = yf-y0+1;
        if(allocated_width != local_width){
            x = realloc(x, local_width*sizeof(int));
        };
        if(allocated_height != local_height){
            y = realloc(y, local_height*sizeof(int));
        };
        for(int n=0; n<local_width; n++){
            x[n] = x0+n;
        };
        for(int n=0; n<local_height; n++){
            y[n] = y0+n;
        };
        
        // Build the local data array
        if(allocated_width*allocated_height != local_width*local_height){
            local_data = realloc(local_data, local_width*local_height*sizeof(double));
        };
        for(int n=0; n<local_height; n++){
            for(int m=0; m<local_width; m++){
                local_data[n*local_width+m] = img_data[y[n]][x[m]];
            };
        };
        
        allocated_width = local_width;
        allocated_height = local_height;
        
        local_min = local_data[0];
        local_max = local_data[0];
        for(int n=1; n<local_width*local_height; n++){
            if(local_data[n]<local_min){
                local_min = local_data[n];
            }else if(local_data[n]>local_max){
                local_max = local_data[n];
            };
        };
        params[0] = *x_cm; //x_mean
        params[1] = *y_cm; // y_mean
        params[2] = 5;   // alpha1
        params[3] = 5;   // alpha2
        params[4] = 3.5; // beta
        params[5] = 0; // angle from x-axis
        params[6] = local_max-local_min; // height
        params[7] = local_min;   // floor
        
        status = elliptical_moffat_fit(&local_data[0], local_width*local_height, 
                &x[0], &y[0], local_width, local_height, params, &result, threshold);

        for(int n=0; n<NBR_PARAMS; n++){
            objects[i][n] = params[n];
        };
        objects[i][NBR_PARAMS]=(double) status;
        x_cm++;
        y_cm++;
    };
    
    //x_cm = nparray_to_int_array(x_cm_py);
    //y_cm = nparray_to_int_array(y_cm_py);
    obj_array_dims[0] = nbr_objs;
    obj_array_dims[1] = NBR_PARAMS+1;
    obj_array_py = (PyArrayObject *) PyArray_FromDims(2, obj_array_dims, NPY_DOUBLE);
    obj_array = nparray_to_double_2Darray(obj_array_py);
    
    //printf("\n  obj  x_cm  y_cm    x_mean    y_mean    height    floor    beta  status");
    for(int i=0; i<nbr_objs; i++){
        /*printf("\n%5d %5d %5d %9.2f %9.2f %9.2f %8.2f %7.2f %7.0f",
            i, x_cm[i], y_cm[i], objects[i][0], objects[i][1],
            objects[i][6], objects[i][7], objects[i][4], objects[i][8]
        );*/
        for(int j=0; j<=NBR_PARAMS; j++){
            obj_array[i][j] = objects[i][j];
        };
    };
    //printf("\n");
    free_Carrayptrs(obj_array);
    free_Carrayptrs(img_data);
    free_Carrayptrs(objects);
    
    return PyArray_Return(obj_array_py);
};

static PyMethodDef fitting_tools_methods[] = {
	{"fit_elliptical_moffat", fitting_tools_fit_elliptical_moffat, METH_VARARGS},
	{NULL,NULL}
};

void initfitting_tools(){
	(void) Py_InitModule("fitting_tools", fitting_tools_methods);
    import_array();
};