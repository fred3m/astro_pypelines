// fitsviewer.js
// Fits viewer in web browser
// Copyright 2014 by Fred Moolekamp
// License: GPLv3

Astropyp.namespace('Astropyp.Pypelines.Fitsviewer');

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
    if(!options.canvas){
        alert("You must specify a canvas for the fits viewer");
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
        frames:[],
        currentFrame:0,
        activeTool:"panTool",

        loadFitsFile:function(params){
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
        },
        initFitsFile:function(options){
            //console.log("initFitsFile(",options);
            var fitsFile=$.extend(true,{
                imageHDUlist:[],
                update:function(options){
                    fitsFile=$.extend(true,fitsFile,options)
                }
            },options);
            var colormap=options.colormap||default_colormap;
            fitsviewer.fitsFiles[fitsFile.fileId]=fitsFile;
            fitsviewer.loadImage({
                fileId:fitsFile.fileId,
                frame:fitsFile.imageHDUlist[0],
                colormap:colormap,
                scale:fitsFile.scale,
                xCenter:fitsFile.xCenter,
                yCenter:fitsFile.yCenter,
            });
            return fitsFile;
        },
        loadImage:function(params){
            console.log("image:",params);
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
        },
        processImage:function(params){
            //console.log("processImage(",params);
            fitsviewer.controls.rxImage(params);
            fitsviewer.frames[fitsviewer.currentFrame]=params;
            /*if(fitsviewer.controls.frameInput){
                fitsviewer.controls.frameInput.value=params.frame;
            };*/
        },
        loadTile:function(params){
            fitsviewer.jobsocket.sendTask({
                module:"fitsviewer",
                task:"loadTile",
                parameters:params
            });
        },
        processTile:function(tile){
            var image=fitsviewer.frames[fitsviewer.currentFrame];
            //console.log("tile frame:",tile.frame,"x,y centers:",tile.xCenter,tile.yCenter,tile);
            //console.log("currenf frame:",image.xCenter,image.yCenter,image);
            //console.log("image:",image);
            if(
                tile.frame==image.frame &&
                tile.fileId==image.fileId
            ){
                var img=new Image();
                var ctx=fitsviewer.canvas.getContext("2d");
                var x=fitsviewer.imageX2canvas(tile.x,image);
                var y=fitsviewer.imageY2canvas(tile.y,image);
                img.onload=function(){
                    //console.log("tile x,y:",tile.x,tile.y);
                    //console.log("canvas x,y:",x,y);
                    ctx.drawImage(img,x,y);
                };
                img.src=tile.pngName;
            }
        },
        processDataTile:function(tile){
            var image=fitsviewer.frames[fitsviewer.currentFrame];
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
        },
        loadMosaic:function(params){
            //console.log("loadMosaic(",params,")");
            var image=fitsviewer.frames[fitsviewer.currentFrame];
            params=$.extend(true,{
                canvasWidth:fitsviewer.canvas.width,
                canvasHeight:fitsviewer.canvas.height,
                colormap:image.colormap,
                fileId:fitsviewer.frames[fitsviewer.currentFrame].fileId
            },params);
            fitsviewer.jobsocket.sendTask({
                module:"fitsviewer",
                task:"loadMosaic",
                parameters:params
            });
            
        },
        loadHeader:function(hduType){
            var image=fitsviewer.frames[fitsviewer.currentFrame];
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
        },
        processHeader:function(result){
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
        },
        processDir:function(result){
            delete result.id;
            if(fitsviewer.controls.fileDialog){
                fitsviewer.controls.fileDialog.update(result);
            };
            $('#'+fitsviewer.controls.fileDialog.element).dialog("open");
        },
        logProgress:function(text){
            if(fitsviewer.logger){
                fitsviewer.logger.log(text,false);
                fitsviewer.logger.element.scrollTop=fitsviewer.logger.element.scrollHeight;
            }
        },
        errorMsg:function(result){
            var separator="******************************\n"
            var msg=separator+result.error+"\n"+result.traceback+"\n"+separator;
            fitsviewer.logProgress(msg);
            console.log(result);
        },
        receiveMsg:function(result){
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
            }else if(result.id=='directory'){
                fitsviewer.processDir(result);
            }else if(result.id=="progress log"){
                fitsviewer.logProgress(result.log);
            }else if(result.id=="ERROR"){
                fitsviewer.errorMsg(result);
            }
        },
        setWindow:function(image){
            //console.log("setWindow(",image);
            image.x0=image.xCenter-fitsviewer.canvas.width/image.scale/2;
            image.y0=image.yCenter-fitsviewer.canvas.height/image.scale/2;
            image.xf=image.x0+fitsviewer.canvas.width/image.scale;
            image.yf=image.y0+fitsviewer.canvas.height/image.scale;
        },
        transformWindow:function(image,dx,dy,canvas){
            //console.log("transformWindow(",image,dx,dy);
            image.xCenter=image.xCenter+dx;
            image.yCenter=image.yCenter+dy;
            fitsviewer.setWindow(image);
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
        },
        setScale:function(image,newScale,updateCanvas){
            //console.log("setScale(",image,newScale);
            newScale=Math.floor(newScale*fitsPyp.precision)/fitsPyp.precision;
            if(newScale<=0){
                fitsviewer.setBestFit(image,updateCanvas);
            }else{
                var ctx=fitsviewer.canvas.getContext("2d");
                image.scale=newScale;
                fitsviewer.setWindow(image);
                if(updateCanvas){
                    fitsviewer.updateImage(image);
                };
                if(fitsviewer.controls){
                    fitsviewer.controls.scaleInput.value=Math.floor(newScale*10000)/100;
                }
            }
        },
        clearCanvas:function(){
            var ctx=fitsviewer.canvas.getContext("2d");
            ctx.save()
            ctx.setTransform(1,0,0,1,0,0);
            ctx.globalCompositeOperation="destination-over";
            ctx.clearRect(0,0,fitsviewer.canvas.width,fitsviewer.canvas.height);
            ctx.restore();
        },
        canvasX2image:function(x,image){
            return Math.floor(image.x0+x/image.scale);
        },
        canvasY2image:function(y,image){
            return Math.floor(image.y0+(fitsviewer.canvas.height-y)/image.scale);
        },
        imageX2canvas:function(x,image){
            return Math.floor((x-image.x0)*image.scale);
        },
        imageY2canvas:function(y,image){
            return Math.floor(fitsviewer.canvas.height-(y-image.y0)*image.scale);
        },
        getDatapoint:function(x,y){
            clearTimeout(magTimer);
            var image=fitsviewer.frames[fitsviewer.currentFrame];
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
        },
        initControls:function(options){
            fitsviewer.controls=Astropyp.Pypelines.Fitsviewer.initControls(fitsviewer);
        },
        onloaded:function(){}
    },options);
    if(fitsviewer.canvasWidth){
        fitsviewer.canvas.width=fitsviewer.canvasWidth;
    };
    if(fitsviewer.canvasHeight){
        fitsviewer.canvas.height=fitsviewer.canvasHeight;
    };
    fitsviewer.canvas=$.extend(fitsviewer.canvas,{
        mouseDown:false,
        initPos:{
            x:0,
            y:0
        },
        onmousedown:function(event){
            fitsviewer.canvas.initPos={x:event.clientX,y:event.clientY};
            fitsviewer.canvas.mouseDown=true;
            if(fitsviewer.activeTool=="rectTool"){
                var canvas=fitsviewer.canvas;
                canvas.backCanvas=document.createElement('canvas');
                canvas.backCanvas.width=canvas.width;
                canvas.backCanvas.height=canvas.height;
                var backCtx=canvas.backCanvas.getContext('2d');
                backCtx.drawImage(canvas, 0,0);
            }
        },
        onmouseup:function(event){
            var canvas=fitsviewer.canvas;
            var rect=canvas.getBoundingClientRect();
            var image=fitsviewer.frames[fitsviewer.currentFrame];
            var x=event.clientX-rect.left;
            var y=event.clientY-rect.top;
            x=Math.round(fitsviewer.canvasX2image(x,image));
            y=Math.round(fitsviewer.canvasY2image(y,image));
            fitsviewer.canvas.mouseDown=false;
            if(fitsviewer.activeTool=="panTool"){
                fitsviewer.loadImage(image);
            }else if(fitsviewer.activeTool=="centerTool"){
                var deltaX=x-image.xCenter;
                var deltaY=y-image.yCenter;
                fitsviewer.transformWindow(image,deltaX,deltaY,canvas);
                fitsviewer.loadImage(image);
            }else if(fitsviewer.activeTool=="rectTool"){
                var x0=fitsviewer.canvasX2image(canvas.initPos.x,image);
                var y0=fitsviewer.canvasY2image(canvas.initPos.y,image);
                image.xCenter=Math.round((x0+x)/2);
                image.yCenter=Math.round((y0+y)/2);
                image.scale=Math.min(canvas.width/(Math.abs(x-x0)),canvas.height/Math.abs(y-y0))
                fitsviewer.clearCanvas();
                fitsviewer.loadImage(image);
                fitsviewer.controls.changeActiveTool('panTool');
            };
            if(fitsviewer.controls.surfacePlot.active || fitsviewer.activeTool=='surfaceTool'){
                if(fitsviewer.frames.length>0){
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
                if(fitsviewer.frames.length>0){
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
        },
        onmousemove:function(event){
            var canvas=fitsviewer.canvas;
            var rect=canvas.getBoundingClientRect();
            if(fitsviewer.frames.length>0){
                var x=event.clientX-rect.left;
                var y=event.clientY-rect.top;
                var image=fitsviewer.frames[fitsviewer.currentFrame];
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
            if(canvas.mouseDown && fitsviewer.frames.length>0){
                var ctx=canvas.getContext("2d");
                var image=fitsviewer.frames[fitsviewer.currentFrame];
                deltaX=Math.round(event.clientX-canvas.initPos.x);
                deltaY=Math.round(event.clientY-canvas.initPos.y);
                if(fitsviewer.activeTool=="panTool"){
                    fitsviewer.canvas.initPos.x=event.clientX;
                    fitsviewer.canvas.initPos.y=event.clientY;
                    fitsviewer.transformWindow(image,-deltaX/image.scale,deltaY/image.scale,fitsviewer.canvas);
                }else if(fitsviewer.activeTool=="rectTool"){
                    ctx.canvas.width=ctx.canvas.width;
                    ctx.drawImage(canvas.backCanvas,0,0);
                    ctx.rect(canvas.initPos.x,canvas.initPos.y,deltaX,deltaY);
                    ctx.strokeStyle="#AAAAFF";
                    ctx.stroke();
                }
            }
        }
    });
    var wsOptions={receiveAction:fitsviewer.receiveMsg};
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
            fitsviewer.canvas.width=Math.round(window.innerWidth);
            fitsviewer.canvas.height=Math.round(window.innerHeight);
            fitsviewer.loadImage(fitsviewer.frames[fitsviewer.currentFrame]);
        };
    }(fitsviewer);
    
    fitsviewer.onloaded();
    return fitsviewer;
};