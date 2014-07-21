// _fitsviewer.cpp
// Interface to connect Astro Pypeline C++ fitsviewer functions with Python
// 2014 by Fred Moolekamp

#include <Python.h>
#include <iostream>
#include <string>
#include "fitsviewer.h"

template <class T> std::vector<T> list2Vector2d(PyObject *myList){
    int rows,columns;
    T myVector;
    std::vector<T> myVector2d;
    rows=PyList_Size(myList);
    columns=PyList_Size(PyList_GetItem(myList,0));
    for(int i=0;i<rows;i++){
        myVector.clear();
        for(int j=0;j<columns;j++){
            myVector.push_back(PyFloat_AsDouble(PyList_GetItem(PyList_GetItem(myList,i),j)));
        };
        myVector2d.push_back(myVector);
    };
    return myVector2d;
};

static PyObject* astropyp_buildImageTileC(PyObject *self, PyObject *args){
    int tile_width,tile_height,dataMin,dataMax;
    char *cScale,*filename;
    Vector2d<double> dataVector2d;
    Vector2d<int> colorArray;
    std::string colorScale;
    PyObject *cmap,*imageData;
    
    if(!PyArg_ParseTuple(args,"siisOO",&filename,&dataMin,&dataMax,&cScale,&cmap,&imageData)){
        return NULL;
    };
    colorScale=std::string(cScale);
    dataVector2d=list2Vector2d<DoubleVec>(imageData);
    tile_width=PyList_Size(PyList_GetItem(imageData,0));
    tile_height=PyList_Size(imageData);
    colorArray=list2Vector2d<IntVec>(cmap);
    
    //std::cout << "tile width:" << tile_width << " tile height:" << tile_height << std::endl;
    //std::cout<<"colormap:"<<colormap<<std::endl;
    //std::cout<<"size"<<dataVector2d.size();
    getImageTile(filename,tile_width,tile_height,dataMin,dataMax,colorScale,colorArray,dataVector2d);
    
    Py_RETURN_TRUE;
};

static PyMethodDef astropype_methods[] = {
	{"buildImageTileC",(PyCFunction) astropyp_buildImageTileC, METH_VARARGS,NULL},
	{NULL,NULL,0,NULL}
};

#ifdef __cplusplus
extern "C" {
#endif
void initastropyp(){
	Py_InitModule3("astropyp", astropype_methods,"C functions for Astro Pypeline");
}

#ifdef __cplusplus
}
#endif