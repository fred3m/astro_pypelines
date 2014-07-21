// Header for Astro Pypeline
// 2014 by Fred Moolekamp

#ifndef ASTROPYPELINE_H
#define ASTROPYPELINE_H

#include <Python.h>
#include <string>
#include <vector>

// typedef's //
typedef std::vector<int> IntVec;
typedef std::vector<double> DoubleVec;
typedef std::vector<std::string> StringVec;

template <typename T>
using Vector2d=std::vector<std::vector<T> >;

// Functions //
void getImageTile(char *filename, int tile_width, int tile_height, int dataMin, int dataMax, 
                    std::string colorScale, Vector2d<int> colorArray, Vector2d<double> imageData);

// Python Interface Functions //
static PyObject* png_buildImageTileC(PyObject *self, PyObject *args);
template <class T> std::vector<T> list2Vector2d(PyObject *myList);
#endif