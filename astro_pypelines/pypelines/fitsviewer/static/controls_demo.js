// controls.js
// Controls for fits viewer
// Copyright 2014 by Fred Moolekamp
// License: GPLv3

Astropyp.namespace('Astropyp.Pypelines.Fitsviewer');
Astropyp.namespace('Astropyp.Pypelines.Fitsviewer.Controls');
var scaleList=["bestfit",0.1,0.25,0.5,1,2,4,8,16,32,64]
var magTimer;
Astropyp.Pypelines.Fitsviewer.precision=10000;

Astropyp.Pypelines.Fitsviewer.Controls=$.extend(true,Astropyp.Pypelines.Fitsviewer.Controls,{
    imageCoords:{
        div:{'class':'coordDiv'},
        controls:{
            label:{
                type:'label',
                prop:{for:'imageCoords',innerHTML:"Image Coords: "},
            },
            imageCoords:{
                type:'label',
                prop:{id:"imageCoords"},
                events:{
                    mousemove:{
                        func:function(event){
                            $('#imageCoords').prop('innerHTML',event.x.toString()+','+event.y.toString());
                        }
                    }
                }
            }
        }
    },
    physicalCoords:{
        div:{'class':'coordDiv'},
        controls:{
            label:{
                type:'label',
                prop:{innerHTML:"Physical Coords: "},
            },
            physicalCoords:{
                type:'label',
                prop:{id:"physicalCoords",'class':'coords'},
                events:{
                    mousemove:{
                        func:function(params){
                            var image=params.fitsviewer.frames[params.fitsviewer.currentFrame];
                            var physicalX=params.x+image.minCoords[0];
                            var physicalY=params.y+image.minCoords[1];
                            if(image.mosaic){
                                physicalX=params.x;
                                physicalY=params.y;
                            }
                            $('#physicalCoords').prop('innerHTML',physicalX.toString()+','+physicalY.toString());
                        }
                    }
                }
            },
        }
    },
    ra:{
        div:{'class':'coordDiv'},
        controls:{
            label:{
                type:'label',
                prop:{innerHTML:"RA: "},
            },
            ra:{
                type:'label',
                prop:{id:"ra"},
                events:{
                    rcvDatapoint:{
                        func:function(params){
                            var wcsCoords=Astropyp.Utils.initWCScoords(Number(params.ra),Number(params.dec));
                            $('#ra').prop('innerHTML',wcsCoords.getRA(3));
                        }
                    }
                }
            },
        }
    },
    dec:{
        div:{'class':'coordDiv'},
        controls:{
            label:{
                type:'label',
                prop:{innerHTML:"DEC: "},
            },
            dec:{
                type:'label',
                prop:{id:"dec"},
                events:{
                    rcvDatapoint:{
                        func:function(params){
                            var wcsCoords=Astropyp.Utils.initWCScoords(Number(params.ra),Number(params.dec));
                            $('#dec').prop('innerHTML',wcsCoords.getDEC(3));
                        }
                    }
                }
            },
        }
    },
    datapoint:{
        div:{'class':'coordDiv'},
        controls:{
            label:{
                type:'label',
                prop:{innerHTML:"Pixel Value: "},
            },
            datapoint:{
                type:'label',
                prop:{id:"datapoint"},
                events:{
                    rcvDatapoint:{
                        func:function(params){
                            $('#datapoint').prop('innerHTML',params.dataPoint);
                        }
                    }
                }
            },
        }
    },
    panTool:{
        type:'input',
        prop:{
            id:'panTool',
            'class':'smallButton viewer panImage',
            type:'image',
            title:'pan image',
            value:''
        },
        funcStr:{
            click:{
                func:"changeActiveTool",
                params:'panTool'
            }
        }
    },
    rectTool:{
        type:'input',
        prop:{
            id:'rectTool',
            'class':'smallButton viewer resize',
            type:'image',
            title:'zoom in on selected rectangle',
            value:''
        },
        funcStr:{
            click:{
                func:"changeActiveTool",
                params:'rectTool'
            }
        }
    },
    centerTool:{
        type:'input',
        prop:{
            id:'centerTool',
            'class':'smallButton viewer centerImage',
            type:'image',
            title:'center image',
            value:''
        },
        funcStr:{
            click:{
                func:"changeActiveTool",
                params:'centerTool'
            }
        }
    },
    histTool:{
        type:'input',
        prop:{
            id:'histTool',
            'class':'smallButton viewer hist',
            type:'image',
            title:'generate histogram',
            value:''
        },
        funcStr:{
            click:{
                func:"openHistogram",
                params:null
            }
        }
    },
    radialTool:{
        type:'input',
        prop:{
            id:'histTool',
            'class':'smallButton viewer radial',
            type:'image',
            title:'generate radial fit (not yet implemented)',
            value:''
        },
        funcStr:{
            click:{
                func:null,
                params:null
            }
        }
    },
    surfaceTool:{
        type:'input',
        prop:{
            id:'surfaceTool','class':'smallButton viewer surface',
            type:'image',
            title:'generate surface plots',
            value:''
        },
        funcStr:{
            click:{
                func:"openSurfacePlot",
                params:null
            }
        }
    },
    colormapTool:{
        type:'input',
        prop:{
            id:'histTool',
            'class':'smallButton viewer colormapArea',
            type:'image',
            title:'open colormap editor',
            value:''
        },
        funcStr:{
            click:{
                func:"openColorPanel",
                params:null
            }
        }
    },
    openCatalogs:{
        type:'input',
        prop:{
            id:'openCatalogs',
            'class':'smallButton viewer addCatalog',
            type:'image',
            title:'open source catalogs',
            value:''
        },
    },
    openPrimaryHeader:{
        type:'button',
        prop:{id:'openPrimaryHeader','class':'headerBtn',innerHTML:'Primary Header'},
        funcStr:{
            click:{
                func:"fitsviewer.loadHeader",
                params:'primary'
            }
        }
    },
    openImageHeader:{
        type:'button',
        prop:{id:'openImageHeader','class':'headerBtn',innerHTML:'Image Header'},
        funcStr:{
            click:{
                func:"fitsviewer.loadHeader",
                params:'image'
            }
        }
    },
    zoomOut:{
        type:'input',
        prop:{
            id:'zoomOut',
            'class':"smallButton zoom zoomOut",
            type:'image',
            title:'zoom out',
            value:''
        },
        funcStr:{
            click:{
                func:"pressZoom",
                params:'out'
            }
        }
    },
    zoomIn:{
        type:'input',
        prop:{
            id:'zoomIn',
            'class':"smallButton zoom zoomIn",
            type:'image',
            title:'zoom in',
            value:''
        },
        funcStr:{
            click:{
                func:"pressZoom",
                params:'in'
            }
        }
    },
    bestfit:{
        type:'input',
        prop:{
            id:'bestfit',
            'class':"smallButton zoom bestfit",
            type:'image',
            title:'zoom to best fit entire image',
            value:''
        },
        funcStr:{
            click:{
                func:"bestfit",
                params:null
            }
        }
    },
    fullsize:{
        type:'input',
        prop:{
            id:'fullsize',
            'class':"smallButton zoom fullsize",
            type:'image',
            title:'zoom to 100%',
            value:''
        },
        funcStr:{
            click:{
                func:"fullsize",
                params:null
            }
        }
    },
    scaleInput:{
        div:{'class':'scaleInputDiv'},
        controls:{
            scaleInput:{
                type:'input',
                prop:{
                    id:'scaleInput',
                    'class':"scaleInput zoom",
                    type:'text',
                    title:'set custom zoom level',
                },
                funcStr:{
                    change:{
                        func:"setScale",
                        params:'scaleInput'
                    }
                },
                events:{
                    rxImage:{
                        func:function(event){
                            $('#scaleInput').val(Math.floor(event.scale*10000)/100);
                        }
                    }
                }
            },
            scaleLabel:{
                type:'label',
                prop:{innerHTML:'%'}
            }
        }
    },
    loadImage:{
        type:'input',
        prop:{
            id:'loadImage',
            'class':"smallButton loader addImage",
            type:'image',
            title:'load fits file',
            value:''
        },
        funcStr:{
            click:{
                func:"loadImage",
                params:null
            }
        }
    },
    showMosaic:{
        type:'input',
        prop:{
            id:'showMosaic',
            'class':"smallButton loader addMosaic",
            type:'image',
            title:'show image as mosaic',
            value:''
        },
        funcStr:{
            click:{
                func:"loadMosaic",
                params:null
            }
        }
    },
    firstFrame:{
        type:'input',
        prop:{
            id:'firstFrame',
            'class':"smallButton loader firstFrame",
            type:'image',
            title:'go to first image frame in fits file',
            value:''
        },
        funcStr:{
            click:{
                func:"switchFrame",
                params:'first'
            }
        }
    },
    previousFrame:{
        type:'input',
        prop:{
            id:'previousFrame',
            'class':"smallButton loader previousFrame",
            type:'image',
            title:'go to previous image frame in fits file',
            value:''
        },
        funcStr:{
            click:{
                func:"switchFrame",
                params:'previous'
            }
        }
    },
    nextFrame:{
        type:'input',
        prop:{
            id:'nextFrame',
            'class':"smallButton loader nextFrame",
            type:'image',
            title:'go to next image frame in fits file',
            value:''
        },
        funcStr:{
            click:{
                func:"switchFrame",
                params:'next'
            }
        }
    },
    lastFrame:{
        type:'input',
        prop:{
            id:'lastFrame',
            'class':"smallButton loader lastFrame",
            type:'image',
            title:'go to last image frame in fits file',
            value:''
        },
        funcStr:{
            click:{
                func:"switchFrame",
                params:'last'
            }
        }
    },
    frameInput:{
        type:'input',
        prop:{
            id:'frameInput',
            'class':'frameInput loader',
            type:'text',
            title:'go to specified image frame in fits file',
        },
        funcStr:{
            change:{
                func:"customFrame",
                params:null
            }
        },
        events:{
            rxImage:{
                func:function(params){
                    $('#frameInput').val(params.frame);
                }
            },
            setViewer:{
                func:function(params){
                    $('#frameInput').val(params.fitsviewer.frames[params.frame].frame);
                }
            }
        }
    },
    addViewerFrame:{
        type:'input',
        prop:{
            id:'addViewerFrame',
            'class':"smallButton viewerFrame addFrame",
            type:'image',
            title:'add frame to fits viewer',
            value:''
        },
        funcStr:{
            click:{
                func:"addViewerFrame",
                params:null
            }
        }
    },
    removeViewerFrame:{
        type:'input',
        prop:{
            id:'removeViewerFrame',
            'class':"smallButton viewerFrame removeFrame",
            type:'image',
            title:'remove current fitsviewer frame',
            value:''
        },
        funcStr:{
            click:{
                func:"removeViewerFrame",
                params:null
            }
        }
    },
    firstViewerFrame:{
        type:'input',
        prop:{
            id:'firstViewerFrame',
            'class':"smallButton viewerFrame firstFrame",
            type:'image',
            title:'go to first fitsviewer frame',
            value:''
        },
        funcStr:{
            click:{
                func:"switchViewerFrame",
                params:'first'
            }
        }
    },
    previousViewerFrame:{
        type:'input',
        prop:{
            id:'previousViewerFrame',
            'class':"smallButton viewerFrame previousFrame",
            type:'image',
            title:'go to previous fitsviewer frame',
            value:''
        },
        funcStr:{
            click:{
                func:"switchViewerFrame",
                params:'previous'
            }
        }
    },
    nextViewerFrame:{
        type:'input',
        prop:{
            id:'nextViewerFrame',
            'class':"smallButton viewerFrame nextFrame",
            type:'image',
            title:'go to next fitsviewer frame',
            value:''
        },
        funcStr:{
            click:{
                func:"switchViewerFrame",
                params:'next'
            }
        }
    },
    lastViewerFrame:{
        type:'input',
        prop:{
            id:'lastViewerFrame',
            'class':"smallButton viewerFrame lastFrame",
            type:'image',
            title:'go to last fitsviewer frame',
            value:''
        },
        funcStr:{
            click:{
                func:"switchViewerFrame",
                params:'last'
            }
        }
    },
    viewerFrameInput:{
        type:'input',
        prop:{
            id:'viewerFrameInput',
            'class':'frameInput viewerFrame',
            type:'text',
            title:'go to specified fitsviewer frame',
        },
        funcStr:{
            change:{
                func:"customViewerFrame",
                params:null
            }
        },
        events:{
            setViewer:{
                func:function(params){
                    $('#viewerFrameInput').val(params.frame);
                }
            }
        }
    },
});

Astropyp.Pypelines.Fitsviewer.CtrlGroups=$.extend(true,Astropyp.Pypelines.Fitsviewer.CtrlGroups,{
    fitsNavigation:{
        title:'Fits File',
        controls:['loadImage','showMosaic','firstFrame','previousFrame','frameInput','nextFrame','lastFrame']
    },
    zoomTools:{
        title:'Zoom',
        controls:['zoomOut','zoomIn','bestfit','fullsize','scaleInput']
    },
    tools:{
        title:'Tools',
        controls:[
            'panTool',
            'rectTool',
            'centerTool',
            'histTool',
            'radialTool',
            'surfaceTool',
            'colormapTool',
            'openCatalogs',
            'openPrimaryHeader',
            'openImageHeader'
        ]
    },
    imageInfo:{
        title:'Image Info',
        controls:['imageCoords','physicalCoords','ra','dec','datapoint']
    },
    viewerNavigation:{
        title:'Viewer Frame Navigaation',
        controls:['addViewerFrame','removeViewerFrame','firstViewerFrame','previousViewerFrame','viewerFrameInput','nextViewerFrame','lastViewerFrame']
    },
});

Astropyp.Pypelines.Fitsviewer.events={
    mousedown:[],
    mouseup:[],
    mousemove:[],
    rcvDatapoint:[],
    rxImage:[],
    setViewer:[]
};

Astropyp.Pypelines.Fitsviewer.initControl=function(options){
    if(!Astropyp.Utils.check4key(options,['type','panel'],"Control initialized without ")){
        return;
    };
    $ctrl=$('<'+options.type+'/>');
    if(options.hasOwnProperty('prop')){
        $ctrl.prop(options.prop);
    };
    var funcStr=options.funcStr || {};
    for(var f in funcStr){
        $ctrl[f](function(funcStr,f,options){
            return function(){
                Astropyp.Utils.getNamespace(funcStr[f].func,options.panel)(funcStr[f].params);
            }
        }(funcStr,f,options));
    };
    var functions=options.functions||{};
    for(var f in functions){
        $ctrl[f](functions[f]);
    };
    var events=options.events||{};
    for(var event in events){
        options.panel.events[event].push(events[event]);
    };
    return $ctrl;
};

Astropyp.Pypelines.Fitsviewer.initCtrlGroup=function(options){
    var fitsPyp=Astropyp.Pypelines.Fitsviewer;
    if(!Astropyp.Utils.check4key(options,['panel','controls','name','title'],"Control group initialized without ")){
        return;
    };
    var ctrlGroup=$.extend(true,{
        $e:options.panel.$e.append('<div/>').attr('id',options.name),
        state:'panel',
        activeCtrls:{},
        clearAllCtrls:function(){
            ctrlGroup.$e.empty();
        },
        clearCtrl:function(controls){
            for(var i=0;i<controls.length;i++){
                delete activeCtrls[controls[i]];
                $('#'+controls[i]).remove();
            };
        },
        addCtrl:function(ctrl,group,$parent){
            ctrl.panel=group.panel;
            var $ctrl=fitsPyp.initControl(ctrl);
            $parent.append($ctrl);
            group.activeCtrls[$ctrl.id]=$ctrl;
        },
        addCtrls:function(controls){
            for(var i=0;i<controls.length;i++){
                var ctrl=fitsPyp.Controls[controls[i]];
                if(ctrl.hasOwnProperty('controls')){
                    var $div=$('<div/>');
                    $div.prop(ctrl.div);
                    for(var c in ctrl.controls){
                        ctrlGroup.addCtrl(ctrl.controls[c],ctrlGroup,$div);
                    };
                    $('#'+ctrlGroup.name+'-div').append($div);
                }else{
                    ctrlGroup.addCtrl(ctrl,ctrlGroup,$('#'+ctrlGroup.name+'-div'));
                };
            };
        },
        popUp:function(){
            if(ctrlGroup.state!='dialog'){
                ctrlGroup.$e.dialog({
                    title:ctrlGroup.title,
                    resizable:true,
                    draggable:true,
                    autoOpen:true,
                    modal:false,
                    buttons:{
                        Close:function(){
                            plotWindow.close();
                        }
                    }
                });
                ctrlGroup.state='dialog';
            };
        },
        popDown:function(){
            if(ctrlGroup.state!='panel'){
                ctrlGroup.$e.dialog('destroy');
                ctrlGroup.$e.show();
                ctrlGroup.state='panel';
            }
        }
    },options);
    ctrlGroup.panel=options.panel;
    var $fieldset=$("<fieldset class='controlPanel'/>").prop('id',ctrlGroup.name+'-fieldset');
    var $legend=$("<legend class='collapsible'/>").prop({
        innerHTML:ctrlGroup.title,
        id:ctrlGroup.name+'-legend'
    });
    ctrlGroup.$e.append($fieldset);
    $fieldset.append($legend);
    $fieldset.append("<div id='"+ctrlGroup.name+"-div'/>")
    ctrlGroup.addCtrls(options.controls);
};

Astropyp.Pypelines.Fitsviewer.initCtrlGroups=function(options){
    var fitsPyp=Astropyp.Pypelines.Fitsviewer;
    if(!Astropyp.Utils.check4key(options,['panel'],"Control groups initialized without ")){
        return;
    };
    var groups={};
    if(options.hasOwnProperty('groups')){
        for(var group in options.groups){
            groups[group]=Astropyp.Utils.deepCopy(fitsPyp.CtrlGroups[group]);
            if(options.groups[group].hasOwnProperty('controls')){
                groups[group].controls=options.groups[group].controls;
            }
        };
    }else{
        groups=Astropyp.Utils.deepCopy(fitsPyp.CtrlGroups);
    };
    var ctrlGroups={};
    for(var group in groups){
        ctrlGroups[group]=fitsPyp.initCtrlGroup({
            panel:options.panel,
            name:group,
            title:groups[group].title,
            controls:groups[group].controls
        });
        console.log("panel after group:",options.panel.events);
    };
    return ctrlGroups;
};

Astropyp.Pypelines.Fitsviewer.initColorbar=function(options){
    var fitsPyp=Astropyp.Pypelines.Fitsviewer;
    if(!Astropyp.Utils.check4key(options,['canvas'],"Colorbar initialized without ")){
        return;
    };
    
    var colorbar=$.extend(true,{
        image:[],
        build:function(min,max){
            colorbar.image=[];
            for(i=0;i<colorbar.canvas.height;i++){
                colorbar.image.push([]);
                for(j=0;j<colorbar.canvas.width;j++){
                    colorbar.image[i].push(0);
                };
            };
            for(var j=0;j<colorbar.canvas.width;j++){
                var pixelBar=Math.round(min+j*(max-min)/colorbar.canvas.width);
                for(var i=0;i<colorbar.canvas.height;i++){
                    colorbar.image[i][j]=pixelBar;
                };
            };
        },
        update:function(colormap,colorpad){
            var cbx=colorbar.canvas.getContext('2d');
            colorbar.build(colorpad.xmin,colorpad.xmax);
            var imageData=fitsPyp.mapImage(colorbar.image,cbx,colormap)
            cbx.putImageData(imageData,0,0);
        }
    },options);
    return colorbar;
};

Astropyp.Pypelines.Fitsviewer.initColorpad=function(options){
    if(!Astropyp.Utils.check4key(options,['element'],"initColorpad requires ")){
        return;
    };
    var utils=Astropyp.Utils;
    var fitsPyp=Astropyp.Pypelines.Fitsviewer;
    var default_colormap={
        colorFunc:fitsPyp.colorFunctions[2],
        scale:"linear",
        dataMin:0,
        dataMax:765
    };
    
    var colorDiv=document.getElementById(options.element);
    utils.addElement(colorDiv,'canvas',[
        ['id','colorPad'],
        ['class','colorpad'],
        ['width','380px'],
        ['height','200px']
    ]);
    utils.addElement(colorDiv,'canvas',[
        ['id','colorbar'],
        ['class','colorbar'],
        ['width','380px'],
        ['height','20px']
    ]);
    utils.addElement(colorDiv,'br',[['style','clear:both']]);
    utils.addElement(colorDiv,'input',[
        ['id','colorbarMin'],
        ['type','text'],
        ['value','0']
    ]);
    utils.addElement(colorDiv,'input',[
        ['id','colorbarMax'],
        ['type','text'],
        ['value','10000']
    ]);
    utils.addElement(colorDiv,'br',[['style','clear:both']]);
    utils.addElement(colorDiv,'label',[['for','colorMin']]).innerHTML='Pixel values from ';
    utils.addElement(colorDiv,'input',[
        ['id','colorMin'],
        ['type','text'],
        ['value','0'],
        ['class','colorInput']
    ]);
    utils.addElement(colorDiv,'label',[['for','colorMax']]).innerHTML=' to ';
    utils.addElement(colorDiv,'input',[
        ['id','colorMax'],
        ['type','text'],
        ['value','10'],
        ['class','colorInput']
    ]);
    utils.addElement(colorDiv,'div',[['id','data-range']]);
    utils.addElement(colorDiv,'label',[['for','colorScales']]).innerHTML='Color scale';
    
    var selectScale=utils.addElement(colorDiv,'select',[['id','colorScales']]);
    var option1=document.createElement("option");
    option1.text='log';
    option1.value='log';
    var option2=document.createElement("option");
    option2.text='linear';
    option2.value='linear';
    selectScale.appendChild(option1);
    selectScale.appendChild(option2);
    
    utils.addElement(colorDiv,'button',[
        ['id','invert-button'],
        ['style','float:right']
    ]);
    
    var colorpad=$.extend(true,{
        xmin:0,
        xmax:10,
        ymin:0,
        ymax:10,
        xScale:1,
        yScale:1,
        image:[[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
        colormap:default_colormap,
        cursor:{
            x:0,
            y:0,
            size:5,
            fill:'white',
            line:'black',
            lineWidth:2,
            visible:true
        },
        colorbar:fitsPyp.initColorbar({
            canvas:document.getElementById("colorbar")
        }),
        colorbarMin:0,
        colorbarMax:10000,
        setAttr:function(param,value){
            //console.log('param:',param,value);
            if(param=='cursor'){
                colorpad.cursor.x=value.x;
                colorpad.cursor.y=value.y;
            }else if(param=='dataMin'){
                colorpad.colormap.dataMin=value;
            }else if(param=='dataMax'){
                colorpad.colormap.dataMax=value;
            }else{
                colorpad[param]=value;
            };
            switch(param){
            case 'colormap':
                colorpad.colorbar.update(colorpad.colormap,colorpad);
                document.getElementById("colorScales").value=colorpad.colormap.scale;
                break;
            case 'xmin':
            case 'xmax':
                colorpad.xScale=(colorpad.xmax-colorpad.xmin)/colorpad.canvas.width;
                colorpad.cursor.x=colorpad.xValue/colorpad.xScale;
                document.getElementById('colorbarMin').value=Math.round(colorpad.xmin);
                document.getElementById('colorbarMax').value=Math.round(colorpad.xmax);
                colorpad.ymax=(colorpad.xmax-colorpad.xmin)/2;
                colorpad.yScale=(colorpad.ymax-colorpad.ymin)/colorpad.canvas.height;
                colorpad.cursor.y=(colorpad.ymax-colorpad.yValue)/colorpad.yScale;
                break;
            case 'dataMin':
            case 'dataMax':
                colorpad.xValue=(colorpad.colormap.dataMax+colorpad.colormap.dataMin)/2;
                colorpad.yValue=(colorpad.colormap.dataMax-colorpad.colormap.dataMin)/2;
                colorpad.cursor.x=colorpad.xValue/colorpad.xScale;
                colorpad.cursor.y=(colorpad.ymax-colorpad.yValue)/colorpad.yScale;
                break;
            case 'cursor':
                colorpad.xValue=colorpad.cursor.x*colorpad.xScale;
                colorpad.yValue=colorpad.ymax-colorpad.cursor.y*colorpad.yScale;
                break;
            case 'xValue':
                colorpad.cursor.x=colorpad.xValue/colorpad.xScale;
                break;
            case 'yValue':
                colorpad.cursor.y=(colorpad.ymax-colorpad.yValue)/colorpad.yScale;
                break;
            }
        },
        update:function(params){
            //console.log('params:',params);
            var paramOrder=['image','colormap','xmin','xmax','dataMin','dataMax','cursor','xValue','yValue']
            for(i=0;i<paramOrder.length;i++){
                if(params.hasOwnProperty(paramOrder[i])){
                    colorpad.setAttr(paramOrder[i],params[paramOrder[i]]);
                };
            };
            if(colorpad.yValue<colorpad.ymin){
                colorpad.update({
                    xValue:colorpad.xValue,
                    yValue:colorpad.ymin
                });
            }else if(colorpad.yValue>colorpad.ymax){
                colorpad.update({
                    xValue:colorpad.xValue,
                    yValue:colorpad.yMax
                });
            };
            colorpad.colormap.dataMin=Math.round(colorpad.xValue-colorpad.yValue);
            colorpad.colormap.dataMax=Math.round(colorpad.xValue+colorpad.yValue);
            if(colorpad.colormap.dataMin<colorpad.xmin){
                colorpad.update({
                    dataMin:colorpad.xmin,
                    dataMax:colorpad.colormap.dataMax
                });
            }else if(colorpad.colormap.dataMax>colorpad.xmax){
                colorpad.update({
                    dataMin:colorpad.colormap.dataMin,
                    dataMax:colorpad.xmax
                });
            };
            colorpad.onupdate({
                xValue:colorpad.xValue,
                yValue:colorpad.yValue
            });
            colorpad.drawCursor();
        },
        drawCursor:function(){
            var ctx=colorpad.canvas.getContext('2d');
            var fitsPyp=Astropyp.Pypelines.Fitsviewer;
            ctx.canvas.width=ctx.canvas.width;
            if(colorpad.hasOwnProperty('image')){
                var imageData=fitsPyp.mapImage(colorpad.image,ctx,colorpad.colormap);
                ctx.putImageData(imageData,0,0);
                colorpad.colorbar.update(colorpad.colormap,colorpad);
            };
            ctx.beginPath();
            ctx.arc(colorpad.cursor.x,colorpad.cursor.y,colorpad.cursor.size,0,2*Math.PI);
            ctx.fillStyle=colorpad.cursor.fill;
            ctx.fill();
            ctx.lineWidth=colorpad.cursor.lineWidth;
            ctx.strokeStyle=colorpad.cursor.line;
            ctx.stroke();
        },
        onupdate:function(values){
            document.getElementById("colorMin").value=colorpad.colormap.dataMin;
            document.getElementById("colorMax").value=colorpad.colormap.dataMax;
            $("#data-range").slider("option","min",colorpad.xmin);
            $("#data-range").slider("option","max",colorpad.xmax);
            $("#data-range").slider("option","values",[colorpad.colormap.dataMin,colorpad.colormap.dataMax]);
        },
        canvas:$.extend(document.getElementById("colorPad"),{
            mouseDown:false,
            onmousedown:function(event){
                colorpad.canvas.mouseDown=true;
                var rect=colorpad.canvas.getBoundingClientRect();
                colorpad.update({
                    cursor:{
                        x:event.clientX-rect.left,
                        y:event.clientY-rect.top
                    }
                });
            },
            onmouseup:function(event){
                colorpad.canvas.mouseDown=false;
            },
            onmousemove:function(event){
                if(colorpad.canvas.mouseDown){
                    var rect=colorpad.canvas.getBoundingClientRect();
                    colorpad.update({
                        cursor:{
                            x:event.clientX-rect.left,
                            y:event.clientY-rect.top
                        }
                    });
                }
            }
        }),
        updateImage:function(){}
    },options);
    
    document.getElementById('colorbarMin').onchange=function(){
        var colorbarMin=Number(document.getElementById('colorbarMin').value);
        var dataMin=colorpad.colormap.dataMin;
        if(colorbarMin>dataMin){
            dataMin=colorbarMin;
        };
        colorpad.update({
            xmin:colorbarMin,
            dataMin:dataMin
        });
    };
    document.getElementById('colorbarMax').onchange=function(){
        var colorbarMax=Number(document.getElementById('colorbarMax').value);
        var dataMax=colorpad.colormap.dataMax;
        if(colorbarMax<dataMax){
            dataMax=colorbarMax;
        };
        colorpad.update({
            xmax:colorbarMax,
            dataMax:dataMax
        });
    };
    document.getElementById('colorMin').onchange=function(){
        colorpad.update({
            dataMin:Number(document.getElementById("colorMin").value)
        });
    };
    document.getElementById('colorMax').onchange=function(){
        colorpad.update({
            dataMax:Number(document.getElementById("colorMax").value)
        });
    };
    
    var colorScale=document.getElementById("colorScales")
    document.getElementById("colorScales").onchange=function(){
        var colormap=colorpad.colormap;
        colormap.scale=colorScale.value;
        colorpad.update({
            colormap:colormap
        });
    };
    
    var invert=document.getElementById("invert-button");
    invert.innerHTML="Invert";
    invert.onclick=function(){
        var colormap=colorpad.colormap;
        colormap.colorFunc.reverse();
        colorpad.update({
            colorFunc:colormap
        })
    };
    
    // Add a color bar for each colormap fo the user to choose from
    var colorDiv=document.getElementById("colormap-selector");
    for(var i=0;i<fitsPyp.colorFunctions.length;i++){
        var colorId="colormap-"+i.toString();
        utils.addElement(colorDiv,"input",[
            ['type','radio'],
            ['name','colorFuncs'],
            ['value',i]
        ]);
        utils.addElement(colorDiv,"canvas",[
            ['id',colorId],
            ['width',300],
            ['height',20]
        ]);
        utils.addElement(colorDiv,"br",[
            ['style','clear:both']
        ]);
        var canvas=document.getElementById(colorId);
        var colorbar=fitsPyp.initColorbar({canvas:canvas});
        var selectColor={
            id:colorId,
            index:i,
            colorbar:colorbar,
            colormap:{
                colorFunc:fitsPyp.colorFunctions[i],
                scale:"linear",
                dataMin:0,
                dataMax:colorbar.canvas.width
            }
        };
        colorbar.update(selectColor.colormap,{
            xmin:0,
            xmax:colorbar.canvas.width
        });
    };
    
    $("#color-ctrl").dialog({
        resizable:false,
        draggable:true,
        width:400,
        autoOpen:false,
        buttons:{
            "Color map":function(){
                $('#colormap-selector').dialog("open");
            },
            "Update image":function(){
                colorpad.updateImage();
            },
            "Close":function(){
                $(this).dialog("close");
            }
        }
    }).css("font-size", "12px");
    $("#colormap-selector").dialog({
        resizable:false,
        draggable:true,
        width:400,
        autoOpen:false,
        modal:true,
        buttons:{
            "Update":function(){
                var newColorFunc=fitsPyp.colorFunctions[$('input[name="colorFuncs"]:checked').val()];
                var colormap=colorpad.colormap;
                colormap.colorFunc=newColorFunc;
                colorpad.update({
                    colormap:colormap
                });
                $(this).dialog("close");
            },
            "Cancel":function(){
                $(this).dialog("close");
            }
        }
    }).css("font-size", "12px");
    $("#data-range").slider({
        range:true,
        min:colorpad.xmin,
        max:colorpad.xmax,
        values:[
            Number(document.getElementById("colorMin").value),
            Number(document.getElementById("colorMax").value)
        ],
        slide:function(event,ui){
            colorpad.update({
                dataMin:ui.values[0],
                dataMax:ui.values[1]
            });
        }
    });
    
    return colorpad;
};

Astropyp.Pypelines.Fitsviewer.initPlotWindow=function(options){
    var utils=Astropyp.Utils;
    var fitsPyp=Astropyp.Pypelines.Fitsviewer;
    if(!utils.check4key(options,['fitsviewer','plotType','element'],"initPlot window requires ")){
        return;
    };
    var fitsviewer=options.fitsviewer;
    var plot=utils.initPlotWindow(options);
    var dataType='';
    if(options.plotType=='surfacePlot'){
        dataType='viewer-surfacePlot';
    }else if(options.plotType=='histogram'){
        dataType='viewer-histogram';
    };
    
    var div=document.getElementById(plot.element);
    
    if(options.plotType=='surfacePlot'){
        plot.rxFit=function(result){
            if(result.id=='ERROR'){
                alert("Unable to fit as a gaussian");
                fitsviewer.errorMsg(result);
                return;
            };
            var x=Math.floor(result.x_mean*fitsPyp.precision)/fitsPyp.precision;
            var y=Math.floor(result.y_mean*fitsPyp.precision)/fitsPyp.precision;
            var wcs=utils.initWCScoords(result.ra,result.dec);
            var fields=[
                ['Image Coords:',x.toString()+","+y.toString()],
                ['RA: ',wcs.getRA(4)],
                ['DEC: ',wcs.getDEC(4)],
                ['Peak value: ',Math.floor(result.amplitude*fitsPyp.precision)/fitsPyp.precision],
                ['\u03C3 (x): ',Math.floor(result.sigma_x*fitsPyp.precision)/fitsPyp.precision],
                ['\u03C3 (y): ',Math.floor(result.sigma_y*fitsPyp.precision)/fitsPyp.precision],
                ['\u03B8: ',Math.floor(result.theta*fitsPyp.precision)/fitsPyp.precision],
                ['FWHM (x): ',Math.floor(result.fwhm_x*fitsPyp.precision)/fitsPyp.precision],
                ['FWHM (y): ',Math.floor(result.fwhm_y*fitsPyp.precision)/fitsPyp.precision]
            ];
            var params={
                fileId:result.fileId,
                frame:result.frame,
                scale:1,
                tile_width:result.tile_width,
                tile_height:result.tile_height,
                x:result.x,
                y:result.y,
                dataType:'viewer-surfacePlot',
                filetype:'pixels',
                colormap:result.colormap
            };
            var tbl=document.getElementById('surfaceFitParams');
            tbl.innerHTML="";
            for(i=0;i<fields.length;i++){
                var row=tbl.insertRow(i);
                var label=row.insertCell(0);
                var value=row.insertCell(1);
                label.innerHTML=fields[i][0];
                value.innerHTML=fields[i][1];
            };
            fitsviewer.loadTile(params);
        };
        var plotDialog=$('#'+plot.element);
        var buttons=plotDialog.dialog("option","buttons");
        $.extend(true,buttons,{
            'Fit data':function(){
                var image=fitsviewer.frames[fitsviewer.currentFrame];
                var params=Astropyp.Utils.deepCopy(image);
                params['filetype']='pixels';
                params['scale']=1;
                params['tile_width']=plot.plot.diameter;
                params['tile_height']=plot.plot.diameter;
                params['x']=Math.round(plot.center.x-params['tile_width']/2);
                params['y']=Math.round(plot.center.y-params['tile_height']/2);
                params['dataType']='viewer-surfacePlot';
                fitsviewer.jobsocket.sendTask(
                    {
                        module:"fitsviewer",
                        task:"load2dGaussFit",
                        parameters:params
                    },
                    plot.rxFit
                );
            }
        });
        var tbl=utils.addElement(div,'table',[['id','surfaceFitParams']]);
        plot.tblName='surfaceFitParams';
        var row=tbl.insertRow(0);
        var cell1=row.insertCell(0);
        var cell2=row.insertCell(1);
        cell1.innerHTML="Coordinates: ";
        plotDialog.dialog("option","buttons",buttons);
    }else if(options.plotType=='histogram'){
        var tbl=utils.addElement(div,'table',[['id','histStats']]);
        var row=tbl.insertRow(0);
        plot.tblName='histStats';
        plot.updateInfo=function(result){
            if(result.id=='ERROR'){
                fitsviewer.errorMsg(result);
                return;
            };
            var tbl=document.getElementById('histStats');
            tbl.innerHTML="";
            var i=0;
            for(var stat in result){
                if(result.hasOwnProperty(stat) && stat!='id' && stat!='requestId'){
                    var row=tbl.insertRow(i++);
                    var label=row.insertCell(0);
                    var value=row.insertCell(1);
                    label.innerHTML=stat+": ";
                    value.innerHTML=Math.floor(result[stat]*fitsPyp.precision)/fitsPyp.precision;
                };
            };
        };
    };
    
    $('#'+plot.element).dialog({
        close:function(){
            plot.active=false;
        }
    });
    
    var extensions=$.extend(true,{
        load:function(){
            var tbl=document.getElementById(plot.tblName);
            tbl.innerHTML="";
            var image=fitsviewer.frames[fitsviewer.currentFrame];
            var params=Astropyp.Utils.deepCopy(image);
            params['filetype']='pixels';
            params['scale']=1;
            params['tile_width']=plot.plot.diameter;
            params['tile_height']=plot.plot.diameter;
            params['x']=Math.round(plot.center.x-params['tile_width']/2);
            params['y']=Math.round(plot.center.y-params['tile_height']/2);
            params['dataType']=dataType;
            fitsviewer.loadTile(params);
        },
        close:function(){
            $('#'+plot.element).dialog("close");
            plot.active=false;
        }
    },options.extensions);
    plot=$.extend(true,plot,extensions);
    return plot;
};

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
        //frameInput:document.getElementById("frameInput"),
        //datapoint:document.getElementById("datapoint"),
        //ra:document.getElementById("ra"),
        //dec:document.getElementById("dec"),
        //viewerFrameInput:document.getElementById("viewerFrameInput"),
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
            if(isNaN($scale.val())){
                if($scale.val()=="bestfit" && controls.fitsviewer.currentImage!={}){
                    newScale=-1;
                }
            }else{
                newScale=$scale.val()/100;
            };
            controls.fitsviewer.frames[controls.fitsviewer.currentFrame].scale=newScale;
            controls.fitsviewer.clearCanvas();
            controls.fitsviewer.frames[controls.fitsviewer.currentFrame].clearDir=true;
            controls.fitsviewer.loadImage(controls.fitsviewer.frames[controls.fitsviewer.currentFrame]);
        },
        loadImage:function(frame){
            controls.fitsviewer.clearCanvas();
            //controls.fileDialog.loadDirectory("/Volumes/Sandbox/astropyp");
            controls.fitsviewer.loadFitsFile({
                path:"/Volumes/Sandbox/images",
                filename:"tu1766308.fits"
                //"path":"/media/data-beta/users/fmooleka/2013A-0723/F100/i/Stacked",
                //"filename":"tu1766308-Stacked-image-i.fits.fz",
            });
        },
        loadMosaic:function(){
            controls.fitsviewer.clearCanvas();
            controls.fitsviewer.loadMosaic();
        },
        loadFrame:function(newFrame,fileId){
            controls.fitsviewer.clearCanvas();
            controls.fitsviewer.loadImage({
                fileId:fileId,
                frame:newFrame,
                colormap:controls.fitsviewer.frames[controls.fitsviewer.currentFrame].colormap
            });
        },
        switchFrame:function(action){
            var image=controls.fitsviewer.frames[controls.fitsviewer.currentFrame];
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
            controls.loadFrame(newFrame,controls.fitsviewer.frames[controls.fitsviewer.currentFrame].fileId);
        },
        addViewerFrame:function(){
            var fitsviewer=controls.fitsviewer;
            fitsviewer.frames.push({});
            fitsviewer.currentFrame=fitsviewer.frames.length-1;
            $('#viewerFrameInput').val(fitsviewer.currentFrame);
            fitsviewer.clearCanvas();
        },
        removeViewerFrame:function(){
            var fitsviewer=controls.fitsviewer;
            if(fitsviewer.frames.length>1){
                fitsviewer.frames.splice(fitsviewer.currentFrame,1);
                if(fitsviewer.currentFrame>0){
                    controls.setViewerFrame(fitsviewer.currentFrame-1);
                };
            }else{
                alert("You must have at least one frame in the fitsviewer");
            };
        },
        setViewerFrame:function(frame){
            var fitsviewer=controls.fitsviewer;
            if(frame>=0 && frame<fitsviewer.frames.length){
                fitsviewer.currentFrame=frame;
                fitsviewer.clearCanvas();
                fitsviewer.loadImage(fitsviewer.frames[frame]);
                controls.setViewer({
                    fitsviewer:fitsviewer,
                    frame:frame
                });
            };
        },
        switchViewerFrame:function(action){
            if(controls.fitsviewer.frames.length==1){
                return;
            };
            if(action=='first'){
                controls.setViewerFrame(0);
            }else if(action=='previous'){
                controls.setViewerFrame(controls.fitsviewer.currentFrame-1);
            }else if(action=='next' && controls.fitsviewer.currentFrame<controls.fitsviewer.frames.length-1){
                controls.setViewerFrame(controls.fitsviewer.currentFrame+1);
            }else if(action=='last'){
                controls.setViewerFrame(controls.fitsviewer.frames.length-1);
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
            if(controls.fitsviewer.frames.length>0){
                var currentImage=controls.fitsviewer.frames[controls.fitsviewer.currentFrame];
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
                var image=fitsviewer.frames[fitsviewer.currentFrame];
                image.clearDir=true;
                image.colormap=Astropyp.Utils.deepCopy(controls.colorpad.colormap);
                fitsviewer.loadImage(image);
            }
        })
    };
    controls.controls;fitsPyp.initCtrlGroups({panel:controls});
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
    $('#catalogs').toggle();
    
    //This is for the surface plotting tool
    // It woud be nice to replace this with a routine that
    // doesn't require an internet connection like the google visualization api does
    google.load("visualization", "1");
    
    controls.fileDialog.clickOpen=function(){
        var fileInput=document.getElementById(controls.fileDialog.fileInput);
        controls.fitsviewer.loadFitsFile({
            path:controls.fileDialog.path,
            filename:fileInput.value
        });
    };
    
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
    console.log("events:",controls.events);
    return controls;
};