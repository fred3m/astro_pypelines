// fitsviewer.cpp
// C++ functions used in Astro Pypeline fitsviewer
// 2014 by Fred Moolekamp

#include <vector>
#include <cmath>
#include <string>
#include <iostream>
#include "fitsviewer.h"
#include "lodepng.h"

void getImageTile(char *filename,int tile_width, int tile_height, int dataMin, int dataMax, 
                    std::string colorScale, Vector2d<int> colorArray, Vector2d<double> imageData){
    double mapFunc,logMax,logMin,pixel;
    std::vector<unsigned char> pngVec;
    
    //extract the colormap
    IntVec rgbArray;
    rgbArray.push_back(colorArray[0][0]);
    rgbArray.push_back(colorArray[0][1]);
    rgbArray.push_back(colorArray[0][2]);
    int n=0;
    for(Vector2d<int>::const_iterator it=++colorArray.begin();it!=colorArray.end();++it){
        Vector2d<int>::const_iterator previous=it;
        --previous;
        int deltaR=(*it)[0]- (*previous)[0];
        int deltaG=(*it)[1]- (*previous)[1];
        int deltaB=(*it)[2]- (*previous)[2];
        int steps=std::max(std::max(abs(deltaR),abs(deltaG)),abs(deltaB));
        double redStep=(double)deltaR/(double)steps;
        double greenStep=(double)deltaG/(double)steps;
        double blueStep=(double)deltaB/(double)steps;
        for(int j=1;j<=steps;j++){
            int rgbEntry[]={
                (*previous)[0]+(int)(redStep*(double)j),
                (*previous)[1]+(int)(greenStep*(double)j),
                (*previous)[2]+(int)(blueStep*(double)j)
            };
            rgbArray.insert(rgbArray.end(),&rgbEntry[0],&rgbEntry[sizeof(rgbEntry)/sizeof(rgbEntry[0])]);
        };
    };
    /*for(int i=0;i<rgbArray.size();i+=3){
        std::cout<<(double)i/3.0<<std::endl;
        std::cout<<"rgb:"<<rgbArray[i]<<","<<rgbArray[i+1]<<","<<rgbArray[i+2]<<std::endl;
    };*/
    // create png file
    pngVec.clear();
    if(colorScale=="linear"){
        mapFunc=(double)(rgbArray.size()-1)/3/(double)(dataMax-dataMin);
    }else if(colorScale=="log"){
        logMin=0;
        logMax=log10(dataMax-dataMin);
        mapFunc=(double)(rgbArray.size()-1)/3/logMax;
    };
    for(Vector2d<double>::reverse_iterator row=imageData.rbegin();row!=imageData.rend();++row){
        for(DoubleVec::const_iterator it=row->begin();it!=row->end();++it){
            int mappedPixel;
            if(colorScale=="linear"){
                if(*it>dataMax){
                    pixel=(double)dataMax-(double)dataMin;
                }else if(*it<dataMin){
                    pixel=0;
                    mappedPixel=0;
                }else{
                    pixel=*it-(double)dataMin;
                };
                mappedPixel=(int)(pixel*mapFunc);
            }else if(colorScale=="log"){
                if(*it>=dataMax){
                    pixel=logMax;
                }else if(*it<=dataMin){
                    pixel=logMin;
                }else{
                    pixel=*it-(double)dataMin;
                    if(pixel<=1){
                        pixel=1;
                    };
                    pixel=log10(pixel);
                };
                mappedPixel=(int)(pixel*mapFunc);
            };
            /*int red=rgbArray[mappedPixel*3];
            int green=rgbArray[mappedPixel*3+1];
            int blue=rgbArray[mappedPixel*3+2];
            if(pixel==0){
                std::cout<<"red:"<<red<<std::endl;
                std::cout<<"green:"<<green<<std::endl;
                std::cout<<"blue:"<<blue<<std::endl;
                std::cout<<"linear map:"<<mapFunc<<"\npixel:"<<pixel<<"\nmapped pixel:"<<mappedPixel<<std::endl;
            };*/
            pngVec.push_back(rgbArray[mappedPixel*3]);
            pngVec.push_back(rgbArray[mappedPixel*3+1]);
            pngVec.push_back(rgbArray[mappedPixel*3+2]);
            pngVec.push_back(255);
        };
        //std::cout<<std::endl;
    };
    
    //std::cout<<"min:"<<dataMin<<", Max:"<<dataMax<<std::endl;
    //std::cout<<"size:"<<pngVec.size()<<std::endl;
    //std::cout<<"wxh:"<<tile_width*tile_height<<std::endl;
    
    //Encode the image
    unsigned error = lodepng::encode(filename, pngVec, tile_width, tile_height);

    //if there's an error, display it
    if(error) std::cout << "encoder error " << error << ": "<< lodepng_error_text(error) << std::endl;
};