Astropyp.namespace('Astropyp.Pypelines.Fitsviewer.Controls');

Astropyp.Pypelines.Fitsviewer.events={
    mousedown:[],
    mouseup:[],
    mousemove:[],
    rcvDatapoint:[],
    rxImage:[],
    setViewer:[]
};

/*
Astropyp.Pypelines.Fitsviewer.Controls

Controls that can be displayed on the control panel. This is a JSON object that contains other objects, each one
giving the properties for a control in the group.

Properties
----------
div: 
*/
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
                            var image=params.fitsviewer.multiCanvas.current_frame.image;
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
        funcStr:{
            click:{
                func:"openCatalogDialog",
                params:null
            }
        }
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
                    $('#frameInput').val(params.fitsviewer.multiCanvas.current_frame.image.frame);
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
    viewerWCSalign:{
        type:'input',
        prop:{
            id:'viewer-wcs-align',
            'class':'smallButton viewerFrame wcs-align',
            type:'image',
            title:'align all frames to this one',
            value:''
        },
        funcStr:{
            click:{
                func:'wcsAlign',
                params:null
            }
        }
    }
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
        controls:['addViewerFrame','removeViewerFrame','firstViewerFrame','previousViewerFrame','viewerFrameInput','nextViewerFrame','lastViewerFrame','viewerWCSalign']
    },
});

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
    };
    return ctrlGroups;
};

console.log('controls.js loaded');