#include <stdio.h>
#include <math.h>
#include "mpfit.h"
#include "fitting_tools.h"

double elliptical_moffat(double x, double y, double *params){
    double A, B, C, moff;
    double x_mean = params[0];
    double y_mean = params[1];
    double alpha1 = params[2];
    double alpha2 = params[3];
    double beta = params[4];
    double angle = params[5];
    double height = params[6];
    double base = params[7];
    A = pow((cos(angle)/alpha1),2) + pow((sin(angle)/alpha2),2);
    B = pow((sin(angle)/alpha1),2) + pow((cos(angle)/alpha2),2);
    C = 2*sin(angle)*cos(angle)*(1./pow(alpha1,2) - 1./pow(alpha2,2));
    
    moff=base + height/pow((1.+ A*(pow((x-x_mean),2)) + B*(pow((y-y_mean),2)) + C*(x-x_mean)*(y-y_mean)),beta);
    return moff;
};

int elliptical_moffat_fitter(int array_len, int nbr_params, double *params, 
                double *error, double **derivatives, struct elliptical_moffat_vars *fit_vars){
    int width, height;
    double data_point, model_point;
    int *x;
    int *y;
    double *data;
    
    x = fit_vars->x;
    y = fit_vars->y;
    data = fit_vars->img_data;
    width = fit_vars->width;
    height = fit_vars->height;
    
    for(int i=0; i<height; i++){
        for(int j=0; j<width; j++){
            data_point = data[i*width + j];
            model_point = elliptical_moffat(x[j], y[i], params);
            error[j*width + i] = data_point-model_point;
        };
    };
    
    //for(int i=0; i<20; i++){
    //    printf("x %d: %d, ", i, x[i]);
    //};
    //printf("\n\n");
    
    return 0;
};

int elliptical_moffat_fit(double *img_data, int img_length, int *x, int *y, int width, 
            int height, double *init_params, mp_result *result, double threshold){
    int status;
    struct elliptical_moffat_vars fit_vars;
    mp_config configs;
    mp_par pars[NBR_PARAMS];
    
    memset(&pars[0], 0, sizeof(pars));
    pars[0].limited[0] = 1;
    pars[0].limits[0] = x[0];
    pars[0].limited[1] = 1;
    pars[0].limits[1] = x[0]+width;
    pars[1].limited[0] = 1;
    pars[1].limits[0] = y[0];
    pars[1].limited[1] = 1;
    pars[1].limits[1] = y[0]+height;
    pars[6].limited[0] = 1;
    pars[6].limits[0] = threshold;
    
    fit_vars.x = x;
    fit_vars.y = y;
    fit_vars.img_data = img_data;
    fit_vars.width = width;
    fit_vars.height = height;
    
    memset(&configs, 0, sizeof(configs));
    configs.maxiter=200;
    
    /*
    printf("\nBefore:\n");
    for(int i=0; i<8; i++){
        printf("param %d: %f, ", i, init_params[i]);
    };*/
    
    status = mpfit(elliptical_moffat_fitter, img_length, NBR_PARAMS, init_params, pars, 0, 
                    (void *) &fit_vars, result);
    
    /*printf("\nStatus: %d\n", status);
    for(int i=0; i<8; i++){
        printf("param %d: %f, ", i, init_params[i]);
    };*/
    //printf("\nFinished mpfit\n");
    return status;
};