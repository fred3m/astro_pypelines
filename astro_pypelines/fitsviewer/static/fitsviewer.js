// fitsviewer.js
// Fits viewer in web browser
// Copyright 2014 by Fred Moolekamp
// License: GPLv3

Astropyp.namespace('Astropyp.Pypelines.Fitsviewer');

Astropyp.Pypelines.Fitsviewer.dependencies={
    jQuery_ui:{
        //url:"static/jquery-ui-1.10.4.custom/js/jquery-ui-1.10.4.custom.js",
        url:"static/jquery-ui-1.11.0/jquery-ui.min.js",
        isloaded:'$.ui',
        wait:true
    },
    jQuery_ui_css:{
        //url:'static/jquery-ui-1.10.4.custom/css/ui-lightness/jquery-ui-1.10.4.custom.css',
        url:'static/jquery-ui-themes-1.11.0/themes/redmond/jquery-ui.min.css',
        wait:false
    },
    graph3d:{
        url:"static/graph3d-1.2/graph3d.js",
        isloaded:'links',
        wait:true
    },
    high_charts:{
        url:'static/Highcharts-3.0.10/js/highcharts.js',
        isloaded:'Highcharts',
        wait:true
    },
    spectrum:{
        url:'fitsviewer/static/spectrum.js',
        isloaded:'spectrum',
        wait:true
    },
    spectrum_css:{
        url:'fitsviewer/static/spectrum.css',
        wait:false
    },
    control_panel:{
        url:'fitsviewer/static/control_panel.js',
        isloaded:'Astropyp.Pypelines.Fitsviewer.initControls',
        wait:true
    },
    analysis_tools:{
        url:'fitsviewer/static/analysis_tools.js',
        isloaded:'Astropyp.Pypelines.Fitsviewer.initPlotWindow',
        wait:true
    },
    colorpad:{
        url:'fitsviewer/static/colorpad.js',
        isloaded:'Astropyp.Pypelines.Fitsviewer.initColorbar',
        wait:true
    },
    catalog:{
        url:'catalog/static/catalog.js',
        isloaded:'Astropyp.Pypelines.Catalog',
        wait:true
    },
    catalog_ctrl:{
        url:'fitsviewer/static/catalog_controls.js',
        isloaded:'Astropyp.Pypelines.Fitsviewer.Catalogs',
        wait:true
    },
    controls:{
        url:'fitsviewer/static/controls.js',
        isloaded:'Astropyp.Controls',
        wait:true
    },
    astropyp_css:{
        url:'static/astropyp.css',
        wait:false
    },
    fitsviewer_css:{
        url:'fitsviewer/static/fitsviewer.css',
        wait:false
    },
    controls_css:{
        url:'fitsviewer/static/controls.css',
        wait:false
    },
}

// Load js and css dependencies for the fitsviewer and any user defined dependencies
Astropyp.Pypelines.Fitsviewer.load=function(options){
    var dependencies=$.extend(true,Astropyp.Pypelines.Fitsviewer.dependencies,options.dependencies);
    return Astropyp.Utils.loadDependencies(dependencies,Astropyp.Pypelines.Fitsviewer.fitsviewerInit,options.options);
};

Astropyp.Pypelines.Fitsviewer.colorFunctions=[
    [[0,0,0],[255,255,255]], // Grayscale
    [[255,0,0],[0,255,0],[0,0,255]], //Short Rainbow
    [[0,0,0],[255,0,0],[255,255,0],[255,255,255]], //Heat
    [[0,0,0],[0,0,255],[0,255,255],[255,255,255],[255,0,255],[255,0,0]], //BGR-G-B
    [[0,0,0],[255,0,0],[255,0,255],[255,255,255],[0,255,255],[0,0,255]], //RGB-R-G
    [[0,0,0],[0,0,255],[255,0,255],[255,0,0],[255,255,0],[255,255,255]], //BR-BGB
    [[0,0,0],[255,0,0],[255,255,0],[0,255,0],[0,255,255],[0,0,255],[255,0,255],[255,255,255]]//Long Rainbow
];

Astropyp.Pypelines.Fitsviewer.setPixel=function(imageData,x,y,r,g,b,a) {
    index=(x+y*imageData.width)*4;
    imageData.data[index+0]=r;
    imageData.data[index+1]=g;
    imageData.data[index+2]=b;
    imageData.data[index+3]=a;
};

Astropyp.Pypelines.Fitsviewer.extractColormap=function(colormap){
    var rgbArray=[[colormap.colorFunc[0][0],colormap.colorFunc[0][1],colormap.colorFunc[0][2]]];
    for(var i=1;i<colormap.colorFunc.length;i++){
        var deltaR=colormap.colorFunc[i][0]-colormap.colorFunc[i-1][0];
        var deltaG=colormap.colorFunc[i][1]-colormap.colorFunc[i-1][1];
        var deltaB=colormap.colorFunc[i][2]-colormap.colorFunc[i-1][2];
        var steps=Math.max(Math.abs(deltaR),Math.abs(deltaG),Math.abs(deltaB));
        var rStep=deltaR/steps;
        var gStep=deltaG/steps;
        var bStep=deltaB/steps;
        var r=colormap.colorFunc[i-1][0];
        var g=colormap.colorFunc[i-1][1];
        var b=colormap.colorFunc[i-1][2];
        for(j=1;j<=steps;j++){
            rgbArray.push([r+Math.round(rStep*j),g+Math.round(gStep*j),b+Math.round(bStep*j)]);
        }; 
    };
    return rgbArray;
};

Astropyp.Pypelines.Fitsviewer.linearmapPixel=function(pixel,colormap,rgbArray){
    var linearmap=(rgbArray.length-1)/(colormap.dataMax-colormap.dataMin);
    if(pixel<colormap.dataMin){
        pixel=colormap.dataMin;
    }else if(pixel>colormap.dataMax){
        pixel=colormap.dataMax;
    };
    return rgbArray[Math.round(linearmap*(pixel-colormap.dataMin))];
};

Astropyp.Pypelines.Fitsviewer.logmapPixel=function(pixel,colormap,rgbArray){
    var dataMin=0;
    var dataMax=Astropyp.Utils.log10(colormap.dataMax-colormap.dataMin);
    var logmap=(rgbArray.length-1)/dataMax;
    if(pixel<colormap.dataMin){
        pixel=0;
    }else if(pixel>colormap.dataMax){
        pixel=dataMax;
    }else{
        pixel=pixel-colormap.dataMin;
        if(pixel<=0){
            pixel=1;
        };
        pixel=Astropyp.Utils.log10(pixel);
    };
    return rgbArray[Math.round(logmap*pixel)];
};

Astropyp.Pypelines.Fitsviewer.mapImage=function(image,ctx,colormap){
    var fitsPyp=Astropyp.Pypelines.Fitsviewer;
    var imageData=ctx.createImageData(image[0].length,image.length);
    var rgbArray=fitsPyp.extractColormap(colormap);
    if(colormap.scale=='linear'){
        for(var i=0;i<image.length;i++){
            for(var j=0;j<image[i].length;j++){
                var rgb=fitsPyp.linearmapPixel(image[i][j],colormap,rgbArray);
                fitsPyp.setPixel(imageData,j,image.length-i,rgb[0],rgb[1],rgb[2],255);
            }
        };
    }else if(colormap.scale=='log'){
        for(var i=0;i<image.length;i++){
            for(var j=0;j<image[i].length;j++){
                var rgb=fitsPyp.logmapPixel(image[i][j],colormap,rgbArray);
                fitsPyp.setPixel(imageData,j,image.length-i,rgb[0],rgb[1],rgb[2],255);
            }
        };
    }else{
        alert('colormap scale not supported yet or not recognized');
    }
    return imageData;
};

Astropyp.Pypelines.Fitsviewer.fitsviewerInit=function(options){
    if(!options.multiCanvas){
        alert("You must specify a multiCanvas for the fits viewer");
        return {};
    };
    var utils=Astropyp.Utils;
    var fitsPyp=Astropyp.Pypelines.Fitsviewer;
    var default_tile_width=400;
    var default_tile_height=200;
    var default_colormap={
        colorFunc:fitsPyp.colorFunctions[2],
        scale:"linear",
        dataMin:0,
        dataMax:765
    };
    
    var fitsviewer=$.extend(true,{
        id:"mainViewer",
        fitsFiles:[],
        //frames:[],
        //currentFrame:0,
        activeTool:"panTool",
        loadFitsFile:function(params){
            return Astropyp.Pypelines.Fitsviewer.loadFitsFile(fitsviewer,params)
        },
        initFitsFile:function(options){
            return Astropyp.Pypelines.Fitsviewer.initFitsFile(fitsviewer,options)
        },
        loadImage:function(params){
            return Astropyp.Pypelines.Fitsviewer.loadImage(fitsviewer,params)
        },
        processImage:function(params){
            return Astropyp.Pypelines.Fitsviewer.processImage(fitsviewer,params)
        },
        loadTile:function(params){
            return Astropyp.Pypelines.Fitsviewer.loadTile(fitsviewer,params)
        },
        processTile:function(tile){
            return Astropyp.Pypelines.Fitsviewer.processTile(fitsviewer,tile)
        },
        processDataTile:function(tile){
            return Astropyp.Pypelines.Fitsviewer.processDataTile(fitsviewer,tile)
        },
        loadMosaic:function(params){
            return Astropyp.Pypelines.Fitsviewer.loadMosaic(fitsviewer,params)
        },
        loadHeader:function(hduType){
            return Astropyp.Pypelines.Fitsviewer.loadHeader(fitsviewer,hduType)
        },
        processHeader:function(result){
            return Astropyp.Pypelines.Fitsviewer.processHeader(fitsviewer,result)
        },
        logProgress:function(text){
            return Astropyp.Pypelines.Fitsviewer.logProgress(fitsviewer,text)
        },
        errorMsg:function(result){
            return Astropyp.Pypelines.Fitsviewer.errorMsg(fitsviewer,result)
        },
        receiveMsg:function(result){
            return Astropyp.Pypelines.Fitsviewer.receiveMsg(fitsviewer,result);
        },
        setWindow:function(image){
            return Astropyp.Pypelines.Fitsviewer.setWindow(fitsviewer,image)
        },
        transformWindow:function(image,dx,dy){
            return Astropyp.Pypelines.Fitsviewer.transformWindow(fitsviewer,image,dx,dy)
        },
        setScale:function(image,newScale,updateCanvas){
            return Astropyp.Pypelines.Fitsviewer.setScale(fitsviewer,image,newScale,updateCanvas)
        },
        canvasX2image:function(x,image){
            return Astropyp.Pypelines.Fitsviewer.canvasX2image(x,image)
        },
        canvasY2image:function(y,image){
            return Astropyp.Pypelines.Fitsviewer.canvasY2image(fitsviewer,y,image)
        },
        imageX2canvas:function(x,image){
            return Astropyp.Pypelines.Fitsviewer.imageX2canvas(x,image)
        },
        imageY2canvas:function(y,image){
            return Astropyp.Pypelines.Fitsviewer.imageY2canvas(fitsviewer,y,image)
        },
        getDatapoint:function(x,y){
            return Astropyp.Pypelines.Fitsviewer.getDatapoint(fitsviewer,x,y);
        },
        initControls:function(options){
            fitsviewer.controls=Astropyp.Pypelines.Fitsviewer.initControls(fitsviewer);
        },
        onloaded:function(){},
        canvasMouseDown:function(event,canvas){
            return Astropyp.Pypelines.Fitsviewer.canvasMouseDown(fitsviewer,event,canvas);
        },
        canvasMouseUp:function(event,canvas){
            return Astropyp.Pypelines.Fitsviewer.canvasMouseUp(fitsviewer,event,canvas);
        },
        canvasMouseMove:function(event,canvas){
            return Astropyp.Pypelines.Fitsviewer.canvasMouseMove(fitsviewer,event,canvas);
        }
    },options);
    fitsviewer.multiCanvas=options.multiCanvas;
    fitsviewer.multiCanvas.canvasMouseDown=fitsviewer.canvasMouseDown;
    fitsviewer.multiCanvas.canvasMouseUp=fitsviewer.canvasMouseUp;
    fitsviewer.multiCanvas.canvasMouseMove=fitsviewer.canvasMouseMove;
    fitsviewer.multiCanvas.addFrame();
    fitsviewer.multiCanvas.current_frame.image=null;
    fitsviewer.canvas=fitsviewer.multiCanvas.addLayer().canvas;
    
    var wsOptions={
        receiveAction:fitsviewer.receiveMsg,
        rcvError:fitsviewer.errorMsg
    };
    if(fitsviewer.logger){
        wsOptions.logger=fitsviewer.logger;
        $('#'+fitsviewer.logger.element.id).parent().dialog({
            title:'Console',
            resizable:true,
            draggable:true,
            autoOpen:true,
            modal:false,
            position:{
                of:$(window),
                my:"left bottom",
                at:"left bottom"
            }
        }).css("font-size", "12px");
    };
    fitsviewer.jobsocket=Astropyp.Core.jobsocketInit(wsOptions);
    fitsviewer.initControls();
    
    window.onresize=function(fitsviewer){
        return function(){
            var multiCanvas=fitsviewer.multiCanvas;
            fitsviewer.canvas.width=Math.round(window.innerWidth);
            fitsviewer.canvas.height=Math.round(window.innerHeight);
            fitsviewer.loadImage(multiCanvas.current_frame.image);
        };
    }(fitsviewer);
    
    utils.initContextMenu({});
    
    fitsviewer.onloaded();
    return fitsviewer;
};

Astropyp.Pypelines.Fitsviewer.loadFitsFile=function(fitsviewer,params){
    var default_colormap={
        colorFunc:Astropyp.Pypelines.Fitsviewer.colorFunctions[2],
        scale:"linear",
        dataMin:0,
        dataMax:765
    };
    if(params.fileId in fitsviewer.fitsFiles){
        fitsviewer.loadImage({
            fileId:fitsFile.fileId,
            frame:fitsFile.imageHDUlist[0],
            colormap:default_colormap
        });
    }else{
        params.colormap=params.colormap||default_colormap;
        //console.log("loadFitsFile(",params);
        fitsviewer.jobsocket.sendTask({
            module:"fitsviewer",
            task:"loadFitsFile",
            parameters:params
        });
    }
};

Astropyp.Pypelines.Fitsviewer.initFitsFile=function(fitsviewer,options){
    //console.log("initFitsFile(",options);
    var fitsFile=$.extend(true,{
        imageHDUlist:[],
        update:function(options){
            fitsFile=$.extend(true,fitsFile,options)
        }
    },options);
    var default_colormap={
        colorFunc:Astropyp.Pypelines.Fitsviewer.colorFunctions[2],
        scale:"linear",
        dataMin:0,
        dataMax:765
    };
    var colormap=options.colormap||default_colormap;
    fitsviewer.fitsFiles[fitsFile.fileId]=fitsFile;
    fitsviewer.loadImage({
        fileId:fitsFile.fileId,
        frame:fitsFile.imageHDUlist[0],
        colormap:colormap
    });
    console.log('fitsFile',fitsFile);
    return fitsFile;
};

Astropyp.Pypelines.Fitsviewer.loadImage=function(fitsviewer,params){
    if(!params.hasOwnProperty('viewer_frame_id')){
        params.viewer_frame_id=fitsviewer.multiCanvas.current_frame.id;
    };
    if(params.mosaic){
        fitsviewer.loadMosaic(params);
    }else{
        //console.log("loadImage(",params,")");
        params=$.extend(true,{
            canvasWidth:fitsviewer.canvas.width,
            canvasHeight:fitsviewer.canvas.height
        },params);
        fitsviewer.jobsocket.sendTask({
            module:"fitsviewer",
            task:"loadImageHDU",
            parameters:params
        });
    };
};

Astropyp.Pypelines.Fitsviewer.processImage=function(fitsviewer,params){
    //console.log("processImage(",params);
    fitsviewer.controls.rxImage(params);
    ////fitsviewer.frames[fitsviewer.currentFrame]=params;
    //fitsviewer.multiCanvas.current_frame.image=params;
    fitsviewer.multiCanvas.frames[params.viewer_frame_id].image=params;
    //console.log(fitsviewer.multiCanvas.current_frame.image);
    
    for(var i=0;i<fitsviewer.multiCanvas.current_frame.layers.length;i++){
        fitsviewer.multiCanvas.current_frame.layers[i].draw();
    }
    
    /*if(fitsviewer.controls.frameInput){
        fitsviewer.controls.frameInput.value=params.frame;
    };*/
};

Astropyp.Pypelines.Fitsviewer.loadTile=function(fitsviewer,params){
    fitsviewer.jobsocket.sendTask({
        module:"fitsviewer",
        task:"loadTile",
        parameters:params
    });
};

Astropyp.Pypelines.Fitsviewer.processTile=function(fitsviewer,tile){
    ////var image=fitsviewer.frames[fitsviewer.currentFrame];
    //var image=fitsviewer.multiCanvas.current_frame.image;
    //console.log("tile frame:",tile.frame,"x,y centers:",tile.xCenter,tile.yCenter,tile);
    //console.log("currenf frame:",image.xCenter,image.yCenter,image);
    //console.log("image:",image);
    /*if(tile.frame==image.frame &&tile.fileId==image.fileId){
        var img=new Image();
        //var ctx=fitsviewer.canvas.getContext("2d");
        var ctx=fitsviewer.multiCanvas.current_frame.layers[0].canvas.getContext("2d");
        var x=fitsviewer.imageX2canvas(tile.x,image);
        var y=fitsviewer.imageY2canvas(tile.y,image);
        img.onload=function(){
            //console.log("tile x,y:",tile.x,tile.y);
            //console.log("canvas x,y:",x,y);
            ctx.drawImage(img,x,y);
        };
        img.src=tile.pngName;
    }*/
    
    var multiCanvas=fitsviewer.multiCanvas;
    for(var i=0;i<multiCanvas.frames.length;i++){
        var image=multiCanvas.frames[i].image;
        if(tile.frame==image.frame &&tile.fileId==image.fileId){
            var img=new Image();
            //var ctx=fitsviewer.canvas.getContext("2d");
            var ctx=fitsviewer.multiCanvas.frames[i].layers[0].canvas.getContext("2d");
            var x=fitsviewer.imageX2canvas(tile.x,image);
            var y=fitsviewer.imageY2canvas(tile.y,image);
            img.onload=function(){
                //console.log("tile x,y:",tile.x,tile.y);
                //console.log("canvas x,y:",x,y);
                ctx.drawImage(img,x,y);
            };
            img.src=tile.pngName;
        }
    }
};

Astropyp.Pypelines.Fitsviewer.processDataTile=function(fitsviewer,tile){
    ////var image=fitsviewer.frames[fitsviewer.currentFrame];
    var image=fitsviewer.multiCanvas.current_frame.image;
    //console.log("tile frame:",tile.frame,"x,y centers:",tile.xCenter,tile.yCenter,tile);
    //console.log("currenf frame:",image.xCenter,image.yCenter,image);
    if(tile.dataType=='viewer-surfacePlot'){
        var data=new google.visualization.DataTable();
        var dataArray=[];
        data.addColumn('number','x');
        data.addColumn('number','y');
        data.addColumn('number','value');
        for(var i=0;i<tile.data.length;i++){
            dataArray.push([]);
            for(var j=0;j<tile.data[i].length;j++){
                data.addRow([i,j,tile.data[i][j]]);
                //dataArray[i].push([tile.x+j,tile.y+i,tile.data[i][j]]);
                dataArray[i].push(tile.data[i][j]);
            };
        };
        fitsviewer.controls.surfacePlot.plot.update({
            data:data
        });
        fitsviewer.controls.surfacePlot.update(tile);
    }else if(tile.dataType=='viewer-histogram'){
        var bins=[];
        var categories=[]
        var data=[];
        var pixels=[];
        var count=1;
        for(var i=0;i<tile.data.length;i++){
            for(var j=0;j<tile.data[i].length;j++){
                pixels.push(Math.round(tile.data[i][j]));
            };
        };
        pixels.sort(function(a,b){return a-b});
        bins.push(pixels[0]);
        categories.push(pixels[0].toString());
        for(var i=1;i<pixels.length;i++){
            if(pixels[i]==pixels[i-1]){
                count+=1;
            }else{
                bins.push(pixels[i]);
                categories.push('');
                data.push([pixels[i],count]);
                count=1;
            }
        };
        data.push([pixels[pixels.length-1],count]);
        var tickStep=bins.length/10;
        for(i=0;i<10;i++){
            var index=Math.floor(tickStep*i);
            categories[index]=bins[index].toString();
        };
        //console.log("bins:",categories);
        //console.log("data:",data);
        fitsviewer.controls.histogram.plot.update({
            series:[{
                type:'column',
                name:'Pixel Value',
                data:data
            }]
        });
        fitsviewer.jobsocket.sendTask({
            module:"tools",
            task:"getDataStats",
            parameters:{
                data:tile.data,
                stats:['mean','stdDev','median']
            }
        },
            fitsviewer.controls.histogram.updateInfo
        );
    }else{
        fitsviewer.controls.colorpad.update({
            image:tile.data,
            colormap:tile.colormap
        });
    };
};

Astropyp.Pypelines.Fitsviewer.loadMosaic=function(fitsviewer,params){
    //console.log("loadMosaic(",params,")");
    ////var image=fitsviewer.frames[fitsviewer.currentFrame];
    var image=fitsviewer.multiCanvas.current_frame.image;
    params=$.extend(true,{
        canvasWidth:fitsviewer.canvas.width,
        canvasHeight:fitsviewer.canvas.height,
        colormap:image.colormap,
        fileId:image.fileId
    },params);
    fitsviewer.jobsocket.sendTask({
        module:"fitsviewer",
        task:"loadMosaic",
        parameters:params
    });
};

Astropyp.Pypelines.Fitsviewer.loadHeader=function(fitsviewer,hduType){
    ////var image=fitsviewer.frames[fitsviewer.currentFrame];
    var image=fitsviewer.multiCanvas.current_frame.image;
    var frame=image.frame;
    if(hduType=='primary'){
        frame=0;
    };
    fitsviewer.jobsocket.sendTask({
        module:"fitsviewer",
        task:"loadHeader",
        parameters:{
            fileId:image.fileId,
            frame:frame
        }
    });
};

Astropyp.Pypelines.Fitsviewer.processHeader=function(fitsviewer,result){
    var fitsFile=fitsviewer.fitsFiles[result.fileId];
    var headerTitle="Fits Header for "+fitsFile.filename+", frame "+result.frame;
    if(result.frame==0){
        headerTitle="Primary Fits Header for "+fitsFile.filename;
    }
    tblParams={
        title:headerTitle,
        header:[
            {title:"Keyword",attributes:[{property:'width',value:'20%'}]},
            {title:"Value",attributes:[{property:'width',value:'40%'}]},
            {title:"Comment",attributes:[{property:'width',value:'40%'}]},
        ],
        data:result.header,
        css:[{className:"#tblDiv",properties:{height:"600px"}}]
    };
    window.open("scrollTable","Fits Header","menubar=0,resizable=1,width=700,height=600");
};

Astropyp.Pypelines.Fitsviewer.logProgress=function(fitsviewer,text){
    if(fitsviewer.logger){
        fitsviewer.logger.log(text,false);
        //fitsviewer.logger.element.scrollTop=fitsviewer.logger.element.scrollHeight;
    }
};

Astropyp.Pypelines.Fitsviewer.errorMsg=function(fitsviewer,result){
    var separator="******************************\n"
    var msg=separator+result.error+"\n"+result.traceback+"\n"+separator;
    fitsviewer.logProgress(msg);
    alert('Error'+result.error);
    console.log(result);
};

Astropyp.Pypelines.Fitsviewer.receiveMsg=function(fitsviewer,result){
    //console.log("recieveMsg(",result);
    if(result.id=="fits file"){
        fitsviewer.initFitsFile(result.properties);
    }else if(result.id=="update fits file"){
        var fitsFile=fitsviewer.fitsFiles[result.properties.fileId];
        fitsFile.update(result.properties);
    }else if(result.id=="image properties"){
        fitsviewer.processImage(result.properties);
    }else if(result.id=="tilepng"){
        fitsviewer.processTile(result);
    }else if(result.id=="image data"){
        fitsviewer.processDataTile(result);
    }else if(result.id=="dataPoint"){
        fitsviewer.controls.rcvDatapoint(result);
    }else  if(result.id=="fitsHeader"){
        fitsviewer.processHeader(result);
        /*}else if(result.id=='directory'){
        fitsviewer.processDir(result);*/
    }else if(result.id=="progress log"){
        fitsviewer.logProgress(result.log);
    }
};

Astropyp.Pypelines.Fitsviewer.setWindow=function(fitsviewer,image){
    //console.log("setWindow(",image);
    image.x0=image.xCenter-fitsviewer.canvas.width/image.scale/2;
    image.y0=image.yCenter-fitsviewer.canvas.height/image.scale/2;
    image.xf=image.x0+fitsviewer.canvas.width/image.scale;
    image.yf=image.y0+fitsviewer.canvas.height/image.scale;
};

Astropyp.Pypelines.Fitsviewer.transformWindow=function(fitsviewer,image,dx,dy){
    //console.log("transformWindow(",image,dx,dy);
    image.xCenter=image.xCenter+dx;
    image.yCenter=image.yCenter+dy;
    fitsviewer.setWindow(image);
    
    for(var i=0;i<fitsviewer.multiCanvas.current_frame.layers.length;i++){
        var canvas=fitsviewer.multiCanvas.current_frame.layers[i].canvas;
        var ctx=canvas.getContext('2d');
        // create backing canvas
        var backCanvas=document.createElement('canvas');
        backCanvas.width=canvas.width;
        backCanvas.height=canvas.height;
        var backCtx=backCanvas.getContext('2d');
        backCtx.drawImage(canvas, 0,0);
        // transform the image
        ctx.save()
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.setTransform(1,0,0,1,-dx*image.scale,dy*image.scale);
        ctx.drawImage(backCanvas,0,0);
        ctx.restore();
        //fitsviewer.multiCanvas.current_frame.layers[i].draw();
    }
};

Astropyp.Pypelines.Fitsviewer.setScale=function(fitsviewer,image,newScale,updateCanvas){
    //console.log("setScale(",image,newScale);
    var fitsPyp=Astropyp.Pypelines.Fitsviewer;
    newScale=Math.floor(newScale*fitsPyp.precision)/fitsPyp.precision;
    if(newScale<=0){
        fitsviewer.setBestFit(image,updateCanvas);
    }else{
        //var ctx=fitsviewer.canvas.getContext("2d");
        var ctx=fitsviewer.multiCanvas.current_frame.layers[0].canvas.getContext("2d");
        image.scale=newScale;
        fitsviewer.setWindow(image);
        if(updateCanvas){
            fitsviewer.updateImage(image);
        };
        if(fitsviewer.controls){
            fitsviewer.controls.scaleInput.value=Math.floor(newScale*10000)/100;
        }
    }
};

Astropyp.Pypelines.Fitsviewer.canvasX2image=function(x,image){
    return Math.floor(image.x0+x/image.scale);
};

Astropyp.Pypelines.Fitsviewer.canvasY2image=function(fitsviewer,y,image){
    return Math.floor(image.y0+(fitsviewer.canvas.height-y)/image.scale);
};

Astropyp.Pypelines.Fitsviewer.imageX2canvas=function(x,image){
    return Math.floor((x-image.x0)*image.scale);
};

Astropyp.Pypelines.Fitsviewer.imageY2canvas=function(fitsviewer,y,image){
    return Math.floor(fitsviewer.canvas.height-(y-image.y0)*image.scale);
};

Astropyp.Pypelines.Fitsviewer.getDatapoint=function(fitsviewer,x,y){
    clearTimeout(magTimer);
    ////var image=fitsviewer.frames[fitsviewer.currentFrame];
    var image=fitsviewer.multiCanvas.current_frame.image;
    fitsviewer.jobsocket.sendTask({
        module:"fitsviewer",
        task:"loadDatapoint",
        parameters:{
            fileId:image.fileId,
            frame:image.frame,
            x:x,
            y:y
        }
    });
};

Astropyp.Pypelines.Fitsviewer.canvasMouseDown=function(fitsviewer,event,canvas){
    //var mainCanvas=fitsviewer.canvas;
    var mainCanvas=fitsviewer.multiCanvas.current_frame.layers[0].canvas;
    mainCanvas.initPos={x:event.clientX,y:event.clientY};
    mainCanvas.mouseDown=true;
    if(fitsviewer.activeTool=="rectTool"){
        mainCanvas.backCanvas=document.createElement('canvas');
        mainCanvas.backCanvas.width=mainCanvas.width;
        mainCanvas.backCanvas.height=mainCanvas.height;
        var backCtx=mainCanvas.backCanvas.getContext('2d');
        backCtx.drawImage(mainCanvas, 0,0);
    }
};

Astropyp.Pypelines.Fitsviewer.canvasMouseUp=function(fitsviewer,event,canvas){
    //var mainCanvas=fitsviewer.canvas;
    var mainCanvas=fitsviewer.multiCanvas.current_frame.layers[0].canvas;
    var rect=mainCanvas.getBoundingClientRect();
    ////var image=fitsviewer.frames[fitsviewer.currentFrame];
    var image=fitsviewer.multiCanvas.current_frame.image;
    var x=event.clientX-rect.left;
    var y=event.clientY-rect.top;
    x=Math.round(fitsviewer.canvasX2image(x,image));
    y=Math.round(fitsviewer.canvasY2image(y,image));
    mainCanvas.mouseDown=false;
    fitsviewer.controls.mouseup($.extend(true,event,{
        coords:{
            x:x,
            y:y
        }
    }));
    if(fitsviewer.activeTool=="panTool"){
        fitsviewer.loadImage(image);
        fitsviewer.multiCanvas.show();
    }else if(fitsviewer.activeTool=="centerTool"){
        var deltaX=x-image.xCenter;
        var deltaY=y-image.yCenter;
        fitsviewer.transformWindow(image,deltaX,deltaY);//,mainCanvas);
        fitsviewer.loadImage(image);
    }else if(fitsviewer.activeTool=="rectTool"){
        var x0=fitsviewer.canvasX2image(mainCanvas.initPos.x,image);
        var y0=fitsviewer.canvasY2image(mainCanvas.initPos.y,image);
        image.xCenter=Math.round((x0+x)/2);
        image.yCenter=Math.round((y0+y)/2);
        image.scale=Math.min(mainCanvas.width/(Math.abs(x-x0)),mainCanvas.height/Math.abs(y-y0))
        fitsviewer.multiCanvas.clear();
        fitsviewer.loadImage(image);
        fitsviewer.controls.changeActiveTool('panTool');
    };
    if(fitsviewer.controls.surfacePlot.active || fitsviewer.activeTool=='surfaceTool'){
        if(fitsviewer.multiCanvas.current_frame.image!==null){
            $("#surface-dialog").dialog("open");
        };
        fitsviewer.controls.surfacePlot.center={
            x:x,
            y:y
        };
        fitsviewer.controls.surfacePlot.load();
        fitsviewer.controls.surfacePlot.active=true;
        fitsviewer.controls.changeActiveTool('panTool');
    };
    if(fitsviewer.controls.histogram.active || fitsviewer.activeTool=='histTool'){
        if(fitsviewer.multiCanvas.current_frame.image!==null){
            $("#hist-dialog").dialog("open");
        };
        fitsviewer.controls.histogram.center={
            x:x,
            y:y
        };
        fitsviewer.controls.histogram.load();
        fitsviewer.controls.histogram.active=true;
        fitsviewer.controls.changeActiveTool('panTool');
        $('#'+fitsviewer.controls.histogram.coordsName).text(x.toString()+','+y.toString());
    };
};

Astropyp.Pypelines.Fitsviewer.canvasMouseMove=function(fitsviewer,event,canvas){
    //var mainCanvas=fitsviewer.canvas;
    var mainCanvas=fitsviewer.multiCanvas.current_frame.layers[0].canvas;
    var rect=mainCanvas.getBoundingClientRect();
    if(fitsviewer.multiCanvas.current_frame.image!==null){
        var x=event.clientX-rect.left;
        var y=event.clientY-rect.top;
        ////var image=fitsviewer.frames[fitsviewer.currentFrame];
        var image=fitsviewer.multiCanvas.current_frame.image;
        x=Math.floor(fitsviewer.canvasX2image(x,image));
        y=Math.floor(fitsviewer.canvasY2image(y,image));
        if(fitsviewer.controls.rcvDatapoint){
            clearTimeout(magTimer);
            if(x>0 && x<image.width && y>0 && y<image.height){
                magTimer=setTimeout(
                    function(){fitsviewer.getDatapoint(x,y);},
                    100
                );
            }
        };
        var params={
            x:x,
            y:y,
            fitsviewer:fitsviewer
        };
        fitsviewer.controls.mousemove(params);
    };
    if(mainCanvas.mouseDown && fitsviewer.multiCanvas.current_frame.image!==null){
        var ctx=mainCanvas.getContext("2d");
        ////var image=fitsviewer.frames[fitsviewer.currentFrame];
        var image=fitsviewer.multiCanvas.current_frame.image;
        deltaX=Math.round(event.clientX-mainCanvas.initPos.x);
        deltaY=Math.round(event.clientY-mainCanvas.initPos.y);
        if(fitsviewer.activeTool=="panTool"){
            mainCanvas.initPos.x=event.clientX;
            mainCanvas.initPos.y=event.clientY;
            fitsviewer.transformWindow(image,-deltaX/image.scale,deltaY/image.scale);//,mainCanvas);
        }else if(fitsviewer.activeTool=="rectTool"){
            ctx.canvas.width=ctx.canvas.width;
            ctx.drawImage(mainCanvas.backCanvas,0,0);
            ctx.rect(mainCanvas.initPos.x,mainCanvas.initPos.y,deltaX,deltaY);
            ctx.strokeStyle="#AAAAFF";
            ctx.stroke();
        }
    };
};

console.log('fitsviewer.js loaded');