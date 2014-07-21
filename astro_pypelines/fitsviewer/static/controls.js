// controls.js
// Controls for fits viewer
// Copyright 2014 by Fred Moolekamp
// License: GPLv3

var scaleList=["bestfit",0.1,0.25,0.5,1,2,4,8,16,32,64]
var magTimer;
Astropyp.Pypelines.Fitsviewer.precision=10000;

Astropyp.Pypelines.Fitsviewer.initControls=function(fitsviewer){
    var histOptsDefault={
        chart:{
            width:580
        },
        title:{
            text:"Pixel Value Distribution"
        },
        subtitle:{
            text:null
        },
        yAxis:{
            min:0,
            title:{
                text:'Multiplicity'
            }
        },
        plotOptions: {
            column: {
                pointPadding: 0.1,
                borderWidth: 0
            }
        },
        series: [{
            type:'column',
            name: 'Pixel Value',
            data: []
        }]
    };
    
    var utils=Astropyp.Utils;
    var fitsPyp=Astropyp.Pypelines.Fitsviewer;
    
    var controls={
        $e:$('#ctrl-panel'),
        fitsviewer:fitsviewer,
        events:utils.deepCopy(fitsPyp.events),
        scaleIndex:1,
        surfacePlot:fitsPyp.initPlotWindow({
            plotType:'surfacePlot',
            element:"surface-dialog",
            fitsviewer:fitsviewer
        }),
        histogram:fitsPyp.initPlotWindow({
            plotType:"histogram",
            element:"hist-dialog",
            plotOpts:histOptsDefault,
            dialogOpts:{
                width:600
            },
            fitsviewer:fitsviewer
        }),
        fileDialog:utils.initFileDialog({
            element:'file-dialog',
            websocket:fitsviewer.jobsocket
        }),
        getScaleIndices:function(scale){
            var index={previous:scaleList[1],next:scaleList[scaleList.length-1]};
            for(var i=1;i<scaleList.length;i++){
                if(scale>scaleList[i]){
                    index.previous=scaleList[i];
                }else if(scale<scaleList[i]){
                    index.next=scaleList[i];
                    return index;
                }else if(scale==scaleList[i]){
                    if(i>0){
                        index.previous=scaleList[i-1];
                    }else{
                        index.previous=scaleList[i];
                    };
                    if(i<scaleList.length-1){
                        index.next=scaleList[i+1];
                    }else{
                        index.next=scaleList[i];
                    };
                    return index;
                }
            };
            return index;
        },
        pressZoom:function(direction){
            var $scale=$('#scaleInput');
            var index=controls.getScaleIndices(Number($scale.val())/100);
            if(direction=='in'){
                $scale.val(index.next*100);
            }else if(direction=='out'){
                $scale.val(index.previous*100);
            }else{
                alert("ERROR: unexpected zoom direction, please check your code");
            }
            controls.setScale();
        },
        bestfit:function(){
            $('#scaleInput').val("bestfit");
            controls.setScale();
        },
        fullsize:function(){
            $('#scaleInput').val(100);
            controls.setScale();
        },
        setScale:function(){
            var newScale;
            var $scale=$('#scaleInput');
            var image=controls.fitsviewer.multiCanvas.current_frame.image;
            if(isNaN($scale.val())){
                if($scale.val()=="bestfit" && controls.fitsviewer.currentImage!={}){
                    newScale=-1;
                }
            }else{
                newScale=$scale.val()/100;
            };
            image.scale=newScale;
            controls.fitsviewer.multiCanvas.clear();
            image.clearDir=true;
            controls.fitsviewer.loadImage(image);
        },
        loadImage:function(frame){
            controls.fitsviewer.multiCanvas.clear();
            controls.fileDialog.load_directory("$project$",function(){
                var fileInput=document.getElementById(controls.fileDialog.fileInput);
                controls.fitsviewer.loadFitsFile({
                    path:controls.fileDialog.path,
                    filename:fileInput.value
                });
            });
        },
        loadMosaic:function(){
            controls.fitsviewer.multiCanvas.clear();
            controls.fitsviewer.loadMosaic();
        },
        loadFrame:function(newFrame,fileId){
            controls.fitsviewer.multiCanvas.clear();
            controls.fitsviewer.loadImage({
                fileId:fileId,
                frame:newFrame,
                colormap:controls.fitsviewer.multiCanvas.current_frame.image.colormap
            });
        },
        switchFrame:function(action){
            var image=controls.fitsviewer.multiCanvas.current_frame.image;
            var fitsFile=controls.fitsviewer.fitsFiles[image.fileId];
            var frameIndex=fitsFile.imageHDUlist.indexOf(image.frame);
            if(frameIndex>=0 && fitsFile.imageHDUlist.length>1){
                if(action=='first'){
                    controls.loadFrame(fitsFile.imageHDUlist[0],image.fileId);
                }else if(action=='previous' && frameIndex>0){
                    controls.loadFrame(fitsFile.imageHDUlist[frameIndex-1],image.fileId);
                }else if(action=='next' && frameIndex<fitsFile.imageHDUlist.length-1){
                    controls.loadFrame(fitsFile.imageHDUlist[frameIndex+1],image.fileId);
                }else if(action=='last'){
                    controls.loadFrame(fitsFile.imageHDUlist[fitsFile.imageHDUlist.length-1],image.fileId);
                };
            }
        },
        customFrame:function(){
            var newFrame=Number($('#frameInput').val());
            controls.loadFrame(newFrame,controls.fitsviewer.multiCanvas.current_frame.image.fileId);
        },
        addViewerFrame:function(){
            var fitsviewer=controls.fitsviewer;
            fitsviewer.multiCanvas.addFrame();
            fitsviewer.multiCanvas.addLayer();
            $('#viewerFrameInput').val(fitsviewer.multiCanvas.current_frame_idx);
        },
        removeViewerFrame:function(){
            var multiCanvas=controls.fitsviewer.multiCanvas;
            multiCanvas.removeFrame(multiCanvas.current_frame);
        },
        setViewerFrame:function(frame){
            var multiCanvas=controls.fitsviewer.multiCanvas;
            if(frame>=0 && frame<multiCanvas.frames.length){
                multiCanvas.setCurrentFrame(frame);
                //fitsviewer.loadImage(fitsviewer.frames[frame]);
                controls.setViewer({
                    fitsviewer:fitsviewer,
                    frame:frame
                });
            };
        },
        switchViewerFrame:function(action){
            var multiCanvas=controls.fitsviewer.multiCanvas;
            var current_idx=multiCanvas.current_frame_idx;
            if(multiCanvas.frames.length==1){
                return;
            };
            if(action=='first'){
                controls.setViewerFrame(0);
            }else if(action=='previous'){
                if(current_idx>0){
                    controls.setViewerFrame(current_idx-1);
                }else{
                    controls.setViewerFrame(multiCanvas.frames.length-1);
                }
            }else if(action=='next'){
                if(current_idx<multiCanvas.frames.length-1){
                    controls.setViewerFrame(current_idx+1);
                }else{
                    controls.setViewerFrame(0);
                }
            }else if(action=='last'){
                controls.setViewerFrame(multiCanvas.frames.length-1);
            };
        },
        customViewerFrame:function(){
            controls.setViewerFrame($('#viewerFrameInput').val());
        },
        changeActiveTool:function(newTool){
            var oldTool=document.getElementById(controls.fitsviewer.activeTool);
            oldTool.style.backgroundColor='#DEDEDE';
            controls.fitsviewer.activeTool=newTool;
            //console.log("new tool:",controls.fitsviewer.activeTool);
            document.getElementById(controls.fitsviewer.activeTool).style.backgroundColor='#AAAAAA'
        },
        openColorPanel:function(){
            if(controls.fitsviewer.multiCanvas.current_frame.image!==null){
                var currentImage=controls.fitsviewer.multiCanvas.current_frame.image;
                $("#color-ctrl").dialog("open");
                controls.colorpad.update({
                    xmin:currentImage.dataMin,
                    xmax:currentImage.dataMax,
                    ymin:1,
                    ymax:(currentImage.dataMax-currentImage.dataMin)/2,
                    dataMax:currentImage.colormap.dataMax,
                    dataMin:currentImage.colormap.dataMin
                });
                var params={
                    fileId:currentImage.fileId,
                    frame:currentImage.frame,
                    scale:currentImage.scale,
                    colormap:currentImage.colormap,
                    filetype:'pixels',
                    tile_width:controls.colorpad.canvas.width,
                    tile_height:controls.colorpad.canvas.height,
                    x:Math.round(currentImage.xCenter-currentImage.tile_width/currentImage.scale/2),
                    y:Math.round(currentImage.yCenter-currentImage.tile_height/currentImage.scale/2),
                    dataType:'colorpad-image'
                };
                controls.fitsviewer.loadTile(params);
                controls.changeActiveTool('panTool');
            };
        },
        openSurfacePlot:function(){
            var data=new google.visualization.DataTable();
            var N=controls.surfacePlot.plot.diameter;
            data.addColumn('number','x');
            data.addColumn('number','y');
            data.addColumn('number','value');
            for(var i=0;i<N;i++){
                for(var j=0;j<N;j++){
                    data.addRow([i,j,0]);
                };
            };
            controls.surfacePlot.plot.update({data:data});
            controls.changeActiveTool('surfaceTool');
        },
        openHistogram:function(){
            controls.changeActiveTool('histTool');
        },
        colorpad:fitsPyp.initColorpad({
            element:'color-ctrl',
            updateImage:function(){
                var image=controls.fitsviewer.multiCanvas.current_frame.image;
                image.clearDir=true;
                image.colormap=Astropyp.Utils.deepCopy(controls.colorpad.colormap);
                fitsviewer.loadImage(image);
            }
        }),
        openCatalogDialog:function(){
            if(controls.fitsviewer.multiCanvas.current_frame.image!==null){
                controls.catalogCtrl.$div.dialog('open');
            }else{
                alert("You must open a fits image before you can open an object catalog");
            }
        },
        wcsAlign:function(){
            var multiCanvas=controls.fitsviewer.multiCanvas;
            var image=multiCanvas.current_frame.image;
            var openFiles=[];
            for(var i=0;i<multiCanvas.frames.length;i++){
                var img=multiCanvas.frames[i].image;
                if(img !== null && i!=multiCanvas.current_frame_idx){
                    openFiles.push({
                        fileId:img.fileId,
                        frame:img.frame
                    });
                }
            };
            controls.fitsviewer.jobsocket.sendTask(
                {
                    module:"fitsviewer",
                    task:"wcsAlign",
                    parameters:{
                        reference:image,
                        openFiles:openFiles
                    }
                },
                function(result){
                    var multiCanvas=controls.fitsviewer.multiCanvas;
                    for(var i=0;i<multiCanvas.frames.length;i++){
                        var image=multiCanvas.frames[i].image;
                        for(var j=0;j<result.files.length;j++){
                            var file=result.files[j];
                            if(image.fileId==file.fileId && image.frame==file.frame){
                                image.xCenter=file.xCenter;
                                image.yCenter=file.yCenter;
                                image.scale=file.scale;
                                controls.fitsviewer.setWindow(image);
                                controls.fitsviewer.loadImage(image);
                            }
                        }
                    };
                    for(var i=0;i<multiCanvas.frames.length;i++){
                        var image=multiCanvas.frames[i].image;
                    };
                }
            );
        }
    };
    fitsPyp.initCtrlGroups({panel:controls});
    controls.catalogCtrl=Astropyp.Pypelines.Fitsviewer.initCatalogCtrl(controls,{});
    
    controls.$e.dialog({
        title:'Control Panel',
        resizable:true,
        draggable:true,
        autoOpen:true,
        modal:false,
        position:{
            of:$(window),
            my:"right top",
            at:"right top"
        }
    }).css("font-size", "12px");

    controls.changeActiveTool("panTool");
    $('.collapsible').click(function(){
        $(this).next().toggle('fast');
        return false;
    });
        
    //google.setOnLoadCallback(console.log('visual loaded'));
    
    for(var event in controls.events){
        controls[event]=function(event){
            return function(params){
                for(var i=0;i<controls.events[event].length;i++){
                    if(controls.events[event][i].hasOwnProperty('func')){
                        controls.events[event][i].func(params);
                    }
                }
            }
        }(event);
    };
    //console.log("events:",controls.events);
    
    return controls;
};

console.log('control_panel.js loaded');