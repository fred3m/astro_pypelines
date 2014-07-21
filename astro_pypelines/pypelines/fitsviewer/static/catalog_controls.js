Astropyp.Pypelines.Fitsviewer.colorpicker={
    color: "#ECC",
    showInput: true,
    className: "full-spectrum",
    showInitial: true,
    showPalette: true,
    showSelectionPalette: true,
    maxPaletteSize: 10,
    preferredFormat: "hex",
    localStorageKey: "spectrum.demo",
    move: function (color) {
        
    },
    show: function () {
    
    },
    beforeShow: function () {
    
    },
    hide: function () {
    
    },
    change: function() {
        
    },
    palette: [
        ["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)",
        "rgb(204, 204, 204)", "rgb(217, 217, 217)","rgb(255, 255, 255)"],
        ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)",
        "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"], 
        ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)", 
        "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)", 
        "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)", 
        "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)", 
        "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)", 
        "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)",
        "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)",
        "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
        "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)", 
        "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]
    ]
}

// Default Values for Catalog Markers
Astropyp.Pypelines.Fitsviewer.Markers={
    circle:{
        shape:'circle',
        radius:10,
        thickness:1
    },
    square:{
        shape:'square',
        width:20,
        thickness:1
    },
    diamond:{
        shape:'diamond',
        diagonal:20,
        thickness:1
    },
    aperture:{
        shape:'aperture',
        thickness:1
    },
};

// Supported Catalogs
Astropyp.Pypelines.Fitsviewer.Catalogs={
    astro:{
        name:'Astropyp'
    },
    sex:{
        name:'SExtractor'
    },
    iraf:{
        name:'IRAF'
    },
    custom:{
        name:'Custom',
        onSelect:function(){
            var $lbl=$('<label/>').prop('innerHTML','Delimiter').prop('for','cat-select-delimiter');
            var $select=$('<select/>').prop('id','cat-select-delimiter');
            var $div=$('<div/>').prop('id','cat-select-delim-div');
            var delimiters=[[' ','Space'],[',',','],[';',';'],['\t','TAB'],['custom','Custom']];
            for(var i=0;i<delimiters.length;i++){
                var $option=$('<option/>').val(delimiters[i][0]).html(delimiters[i][1]);
                $select.append($option);
            };
            catalogCtrl.catSelector.$div.append($lbl);
            catalogCtrl.catSelector.$div.append($select);
            catalogCtrl.catSelector.$div.append($div);
            $select.change(function(){
                $div=$('#cat-select-delim-div');
                $div.html('');
                if($('#cat-select-delimiter').val()=='custom'){
                    var $input=$('<input/>').prop('id','cat-custom-delimiter');
                    $div.append($input);
                }
            });
        },
        getParams:function(){
            var delimiter=$('cat-select-delimiter').val();
            if(delimiter=='custom'){
                delimiter=$('cat-custom-delimiter').val();
            };
            return {delimiter:delimiter};
        }
    }
};

Astropyp.Pypelines.Fitsviewer.DetectSourceParams={
    'maxima size':{
        
    }
};

Astropyp.Pypelines.Fitsviewer.initCatalog=function(options){
    if(!Astropyp.Utils.check4key(options,['path','filename','objects','coordType','fields'],"initCatalog requires ")){
        return;
    };
    jsonObjs=[];
    for(var i=0;i<options.objects.length;i++){
        var obj={};
        for(var j=0;j<options.fields.length;j++){
            obj[options.fields[j]]=options.objects[i][j];
        };
        jsonObjs.push(obj);
    };
    options.objects=jsonObjs;
    var catalog=$.extend(true,{
        name:'unnamed',
        layer:null,
        isVisible:true,
        added:[],
        removed:[],
        marker:Astropyp.Pypelines.Fitsviewer.Markers.circle,
        objColors:{
            psfStar:'#00FF00',
            star:'#FFFF00',
            galaxy:'#FFFFFF',
            asteroid:'#FF0000',
            moon:'#0000FF'
        },
        color:'#FFFFFF',
        changeColors:function(color){
            catalog.color=color;
            if(color=='custom'){
                for(var i=0;i<catalog.objects.length;i++){
                    var object=catalog.objects[i];
                    if(object.hasOwnProperty('objType')){
                        object.color=catalog.objColors[object.objType];
                    }else{
                        object.color=catalog.objColors['star'];
                    }
                }
            }else{
                for(var i=0;i<catalog.objects.length;i++){
                    catalog.objects[i].color=color;
                }
            };
        },
        addSource:function(source){
            var obj={};
            for(var j=0;j<catalog.fields.length;j++){
                obj[catalog.fields[j]]=source[j];
            };
            //console.log('new object',obj);
            catalog.objects.push(obj);
        }
    },options);
    
    catalog.changeColors(catalog.color);
    
    return catalog;
};

Astropyp.Pypelines.Fitsviewer.initCatalogCtrl=function(controls,params){
    var catTypes=$.extend(true,Astropyp.Pypelines.Fitsviewer.Catalogs,params.catTypes);
    
    // Divs for the Catalog Control dialog
    var $catDiv=$('<div/>').prop('id','cat-div');
    var $catListSet=$('<fieldset/>');
    var $catMarkerSet=$('<fieldset/>');
    var $catChangesSet=$('<fieldset/>');
    var $catCtrlDiv=$('<div/>').prop('id','cat-ctrl-div');
    $catDiv.append($catListSet);
    $catDiv.append($catMarkerSet);
    $catDiv.append($catChangesSet);
    $catDiv.append($catCtrlDiv);
    controls.$e.append($catDiv)
    
    // Catalog List
    var $catListLegend=$('<legend/>').prop('class','collapsible').prop('innerHTML','Catalogs: ');
    var $catListHideDiv=$('<div/>');
    var $catListDiv=$('<div/>').prop('id','cat-list-div');
    var $catListAdd=$('<input/>')
        .prop('type','image')
        .prop('class','smallButton catalog addCatalog')
        .prop('title','Add a new catalog')
        .prop('value','');
    var  $catListDetect=$('<input/>')
        .prop('type','image')
        .prop('class','smallButton catalog detectCatalog')
        .prop('title','Detect point sources')
        .prop('value','');
    $catListSet.append($catListLegend);
    $catListSet.append($catListHideDiv);
    $catListHideDiv.append($catListDiv);
    $catListHideDiv.append($catListAdd);
    $catListHideDiv.append($catListDetect);
    
    // Catalog Marker Settings
    var $catMarkerLegend=$('<legend/>').prop('class','collapsible').prop('innerHTML','Marker Settings:');
    var $catMarkerDiv=$('<div/>');
    var $catMarkerParams=$('<div/>').prop('id','cat-marker-params');
    $catMarkerSet.append($catMarkerLegend);
    $catMarkerSet.append($catMarkerDiv);
    $catMarkerDiv.append('<label for="cat-marker-type">Type: </label>');
    $markerType=$('<select/>').prop('id','cat-marker-type');
    $catMarkerDiv.append($markerType);
    for(markerType in Astropyp.Pypelines.Fitsviewer.Markers){
        var $opt=$('<option/>').val(markerType).html(markerType);
        $markerType.append($opt);
    };
    $catMarkerDiv.append($catMarkerParams);
    $catMarkerDiv.hide();
    
    // Catalog Controls
    var ctrls={
        addStar:{
            title:'Add source to catalog',
            'class':'addStar'
        },
        info:{
            title:'Get source info',
            'class':'sourceInfo'
        }
    };
    
    // List of changes made to the active catalog
    var $changesLegend=$('<legend/>').prop('class','collapsible').prop('innerHTML','Unsaved Changes:');
    var $catChangesDiv=$('<div/>').prop('id','cat-changes-div');
    var $changesList=$('<ul/>').prop('id','cat-changes-list');
    //$changesList.append('<li>Added Star at x,1</li>');
    $catChangesDiv.append($changesList);
    $catChangesSet.append($changesLegend);
    $catChangesSet.append($catChangesDiv);
    
    // Elements for the Select Catalog Type dialog
    var $selectDiv=$('<div/>').prop('id','cat-select-div');
    var $selector=$('<select/>').prop('id','cat-select');
    var $div=$('<div/>').prop('id','cat-select-params');
    for(var catType in catTypes){
        var $opt=$('<option/>').val(catType).html(catTypes[catType].name);
        $selector.append($opt);
    };
    var $coordType=$('<select/>').prop('id','cat-select-coord');
    $coordType.append('<option value="image">Image X,Y</option>');
    $coordType.append('<option value="wcs" selected>WCS</option>');
    $selectDiv.append($selector);
    $selectDiv.append($coordType);
    $selectDiv.append($div);
    controls.$e.append($selectDiv);
    
    // Elements for the Source Info
    var $srcDiv=$('<div/>').prop('id','cat-source-div');
    
    var catalogCtrl=$.extend(true,{
        controls:controls,
        nextCatalog:1,
        catalogs:[],
        activeCat:null,
        activeCtrl:'info',
        canvasList:[],
        $div:$catDiv,
        $listDiv:$catListDiv,
        $changesList:$changesList,
        catSelector:$.extend(true,{
            $selectDiv:$selectDiv,
            $selector:$selector,
            $div:$div,
            catTypes:catTypes,
            onSelect:function(){
                var catType=catalogCtrl.catSelector.catTypes[catalogCtrl.catSelector.$selector.val()];
                catalogCtrl.catSelector.$div.html('');
                if(catType.hasOwnProperty('onSelect')){
                    catType.onSelect();
                };
            },
            onOpen:function(){
                var fitsviewer=catalogCtrl.controls.fitsviewer;
                var catType=catalogCtrl.catSelector.catTypes[catalogCtrl.catSelector.$selector.val()];
                ////var currentFrame=fitsviewer.frames[fitsviewer.currentFrame];
                var image=fitsviewer.multiCanvas.current_frame.image;
                var params={
                    type:catalogCtrl.catSelector.$selector.val(),
                    path:catalogCtrl.controls.fileDialog.path,
                    filename:$('#'+catalogCtrl.controls.fileDialog.fileInput).val(),
                    coordType:$('#cat-select-coord').val(),
                    fitsInfo:{
                        fileId:image.fileId,
                        //path:image.path,
                        //filename:image.filename,
                        path:fitsviewer.fitsFiles[image.fileId].path,
                        filename:fitsviewer.fitsFiles[image.fileId].filename,
                        frame:image.frame
                    }
                };
                //console.log('params',params);
                if(catType.hasOwnProperty('getParams')){
                    params=$.extend(true,params,catType.getParams());
                };
                catalogCtrl.controls.fitsviewer.jobsocket.sendTask({
                    module:'catalog',
                    task:'loadCatalog',
                    parameters:params
                },catalogCtrl.catViewer.onLoad);
            }
        },params.catalogSelect),
        srcInfo:$.extend(true,{
            $srcDiv:$srcDiv,
            source:{},
            showSourceInfo:function(result,params){
                catalogCtrl.srcInfo.source=result;
                var xIdx=result.fields.indexOf('x');
                var yIdx=result.fields.indexOf('y');
                var raIdx=result.fields.indexOf('ra');
                var decIdx=result.fields.indexOf('dec');
                var idIdx=result.fields.indexOf('id');
                wcsCoords=Astropyp.Utils.initWCScoords(result.info[raIdx],result.info[decIdx]);
                catalogCtrl.srcInfo.$srcDiv.html('');
                //var catalog=catalogCtrl.catalogs[i];
                $fieldset=$('<fieldset/>');
                $legend=$('<legend/>').html(catalogCtrl.catalogs[params.index].name);
                $div=$('<div/>');
                catalogCtrl.srcInfo.$srcDiv.append($fieldset);
                $fieldset.append($legend);
                $fieldset.append($div);
                //$div.append('<label>File: '+result.catalog+'</label>');
                $div.append('<br><label>Image Coords: '+result.info[xIdx]+','+result.info[yIdx]+'</label>');
                $div.append('<br><label>RA: '+wcsCoords.getRA(3)+'</label>');
                $div.append('<br><label>DEC: '+wcsCoords.getDEC(3)+'</label>');
                
                var editable={
                    isPSF:{
                        type:'checkbox',
                    },
                    objType:{
                        type:'select',
                        options:{
                            unknown:'unknown',
                            star:'star',
                            psfStar:'psf star',
                            galaxy:'galaxy',
                            planet:'planet',
                            moon:'moon',
                            asteroid:'asteroid',
                            saturated:'saturated'
                        }
                    }
                };
                for(var i=0;i<result.info.length;i++){
                    if(i!=xIdx && i!=yIdx && i!=raIdx && i!=decIdx && i!=idIdx){
                        var field=result.fields[i];
                        var $label=$('<br><label>'+field+': </label>');
                        $div.append($label);
                        if(editable.hasOwnProperty(field)){
                            var $input=$('<input/>').prop('type',editable[field].type)
                            for(prop in editable[field].props){
                                $input.prop(prop,editable[field].props[prop]);
                            };
                            if(editable[field].type=='checkbox'){
                                $input.prop('checked',result.info[i]);
                            };
                            if(editable[field].type=='select'){
                                $input=$('<select/>');
                                for(option in editable[field].options){
                                    $option=$('<option/>')
                                        .html(option)
                                        .val(editable[field].options[option])
                                    if($option.val()==result.info[i]){
                                        $option.prop('selected',true);
                                    }
                                    $input.append($option);
                                }
                            };
                            $input.change(function(){
                                //console.log('sources:',catalogCtrl.srcInfo.source);
                                var fieldIdx=catalogCtrl.srcInfo.source.fields.indexOf(field);
                                catalogCtrl.srcInfo.source.info[fieldIdx]=this.value;
                                //console.log('sources:',catalogCtrl.srcInfo.source);
                            });
                            $div.append($input);
                        }else{
                            var $field=$('<label/>').html(result.info[i]);
                            $div.append($field);
                        }
                    }
                };
                catalogCtrl.srcInfo.$srcDiv.dialog('open');
            }
        },params.srcInfo),
        catViewer:$.extend(true,{
            onLoad:function(result){
                if(!result.hasOwnProperty('name')){
                    result.name='cat-'+catalogCtrl.nextCatalog++;
                };
                catalogCtrl.catalogs.push(Astropyp.Pypelines.Fitsviewer.initCatalog(result));
                var catalog=catalogCtrl.catalogs[catalogCtrl.catalogs.length-1];
                catalog.layer=catalogCtrl.controls.fitsviewer.multiCanvas.addLayer();
                //console.log('new layer:',catalog.layer);
                catalog.canvas=catalog.layer.canvas;
                catalog.draw=function(){
                    var fitsviewer=catalogCtrl.controls.fitsviewer;
                    var objects=catalog.objects;
                    if(fitsviewer.multiCanvas.current_frame.image!==null){
                        var image=fitsviewer.multiCanvas.current_frame.image;
                        var canvas=catalog.canvas;
                        var ctx=canvas.getContext('2d');
                        if(catalog.marker.shape=='circle'){
                            var radius=catalog.marker.radius;
                            for(var i=0;i<objects.length;i++){
                                var x=objects[i].x;
                                var y=objects[i].y;
                                if(x>image.x0 && x<image.xf && y>image.y0 && y<image.yf){
                                    ctx.beginPath();
                                    ctx.lineWidth=catalog.marker.thickness;
                                    ctx.strokeStyle=objects[i].color;
                                    ctx.arc(fitsviewer.imageX2canvas(x,image),fitsviewer.imageY2canvas(y,image),radius,0,2*Math.PI);
                                    ctx.stroke();
                                }
                            }
                        }else if(catalog.marker.shape=='square'){
                            var width=catalog.marker.width;
                            var offset=width/2;
                            for(var i=0;i<objects.length;i++){
                                var x=objects[i].x;
                                var y=objects[i].y;
                                if(x>image.x0 && x<image.xf && y>image.y0 && y<image.yf){
                                    var x0=fitsviewer.imageX2canvas(x,image)-offset;
                                    var y0=fitsviewer.imageY2canvas(y,image)+offset;
                                    ctx.beginPath();
                                    ctx.lineWidth=catalog.marker.thickness;
                                    ctx.strokeStyle=objects[i].color;
                                    ctx.moveTo(x0,y0)
                                    ctx.lineTo(x0+width,y0);
                                    ctx.lineTo(x0+width,y0-width);
                                    ctx.lineTo(x0,y0-width);
                                    ctx.lineTo(x0,y0);
                                    ctx.stroke();
                                }
                            }
                        }else if(catalog.marker.shape=='diamond'){
                            console.log('display diamond');
                            var offset=catalog.marker.diagonal/2;
                            for(var i=0;i<objects.length;i++){
                                var x=objects[i].x;
                                var y=objects[i].y;
                                if(x>image.x0 && x<image.xf && y>image.y0 && y<image.yf){
                                    var x0=fitsviewer.imageX2canvas(x,image);
                                    var y0=fitsviewer.imageY2canvas(y,image);
                                    ctx.beginPath();
                                    ctx.lineWidth=catalog.marker.thickness;
                                    ctx.strokeStyle=objects[i].color;
                                    ctx.moveTo(x0-offset,y0)
                                    ctx.lineTo(x0,y0-offset);
                                    ctx.lineTo(x0+offset,y0);
                                    ctx.lineTo(x0,y0+offset);
                                    ctx.lineTo(x0-offset,y0);
                                    ctx.stroke();
                                }
                            }
                        };
                        
                    };
                }
                catalog.layer.objects.push(catalog);
                catalog.layer.clear();
                catalog.layer.draw();
                
                // Add Catalog elements to the list of active catalogs
                var $colorbox=$('<input/>').prop('type','text').css('float','left').width(15).height(15);
                var colorpicker=$.extend(true,Astropyp.Pypelines.Fitsviewer.colorpicker,{
                    color:catalog.color,
                    change:function(catalog){
                        return function(color){
                            catalog.changeColors(color.toHex());
                            catalog.layer.clear();
                            catalog.layer.draw();
                        }
                    }(catalog)
                });
                var $input=$('<input/>')
                    .prop('id',catalog.name+'-input')
                    .val(catalog.name)
                    .css('float','left');
                var $showBtn=$('<input/>')
                    .height('15px')
                    .width('15px')
                    .prop('type','image')
                    .prop('value',' ')
                    .addClass('catalog-visibility')
                    .addClass('catalog-visible')
                    .click(function(catalog){
                        return function(){
                            var classList=this.className.split(' ');
                            var $this=$(this);
                            if(classList.indexOf('catalog-visible')<0){
                                $this.removeClass('catalog-invisible');
                                $this.addClass('catalog-visible');
                                catalog.layer.draw();
                            }else{
                                $this.removeClass('catalog-visible');
                                $this.addClass('catalog-invisible');
                                catalog.layer.hide();
                            };
                        }
                    }(catalog))
                var $radio=$('<input/>')
                    .prop('type','radio')
                    .prop('name','active-cat')
                    .val(catalog)
                    .prop('checked',true)
                    .click(function(catalog){
                        return function(){
                            catalogCtrl.changeActiveCat(catalog);
                        }
                    }(catalog));
                catalogCtrl.$listDiv.append($radio);
                catalogCtrl.$listDiv.append($showBtn);
                catalogCtrl.$listDiv.append($colorbox);
                catalogCtrl.$listDiv.append($input);
                $colorbox.spectrum(colorpicker);
                catalogCtrl.$listDiv.append('<br style="clear:both">');
                catalogCtrl.changeActiveCat(catalog);
            },
        },params.viewer),
        updateMarker:function(catalog,option){
            catalog.marker[option]=$('#cat-marker-'+option).val();
            catalog.layer.clear();
            catalog.layer.draw();
        },
        changeMarker:function(catalog,marker){
            catalog.marker=Astropyp.Utils.deepCopy(marker);
            catalogCtrl.changeMarkerOptions(catalog.marker);
            catalog.layer.clear();
            catalog.layer.draw();
        },
        changeActiveCat:function(catalog){
            catalogCtrl.activeCat=catalog;
            $('#cat-marker-type').val(catalog.marker.shape);
            catalogCtrl.changeMarkerOptions(catalog.marker);
            for(var option in catalog.marker){
                if(option!='shape'){
                    $('#cat-marker-'+option).val(catalog.marker[option]);
                }
            };
        },
        changeMarkerOptions:function(marker){
            $('#cat-marker-params').html('');
            for(var option in marker){
                if(option!='shape'){
                    var $input=$('<input/>')
                        .prop('id','cat-marker-'+option)
                        .val(marker[option])
                        .change(function(option){
                            return function(){
                                catalogCtrl.updateMarker(catalogCtrl.activeCat,option);
                            }
                        }(option));
                    $('#cat-marker-params').append('<br><label>'+option+': </label>');
                    $('#cat-marker-params').append($input);
                }
            }
        },
        getSourceInfo:function(event,catalog){
            var params={
                path:catalog.path,
                filename:catalog.filename,
                coordType:'image',
                wcsConvert:false,
                coord1:event.coords.x,
                coord2:event.coords.y,
            };
            if(catalog.coordType=='wcs'){
                var fitsviewer=catalogCtrl.controls.fitsviewer;
                var image=fitsviewer.multiCanvas.current_frame.image;
                params.wcsConvert=true;
                params.image={
                    fileId:image.fileId,
                    frame:image.frame,
                    path:image.path,
                    filename:image.filename
                }
            };
            catalogCtrl.controls.fitsviewer.jobsocket.sendTask({
                module:'catalog',
                task:'getSourceInfo',
                parameters:params
            },
            catalogCtrl.srcInfo.showSourceInfo,
            {
                index:catalogCtrl.catalogs.indexOf(catalog)
            });
        },
        saveCat:function(options){
            catalogCtrl.controls.fitsviewer.jobsocket.sendTask(
                {
                    module:'catalog',
                    task:'saveCatalog',
                    parameters:$.extend(true,{
                        path:catalogCtrl.activeCat.path,
                        filename:catalogCtrl.activeCat.filename,
                        fileType:catalogCtrl.activeCat.fileType
                    },options)
                },
                function(result,params){
                    if(result.id=='Error'){
                        alert(result.error);
                    };
                    if(result.status=='confirm'){
                        var status=confirm('File already exists, overwrite?');
                        if(status){
                            var params=result.params;
                            params.confirmed=true;
                            /*catalogCtrl.controls.fitsviewer.jobsocket.sendTask({
                                module:'catalog',
                                task:'saveCatalog',
                                parameters:params
                            });*/
                            catalogCtrl.saveCat(params)
                        };
                    }else if(result.status=='saved'){
                        //console.log('File saved successfully');
                        params.catalog.fileType='astro';
                        catalogCtrl.$changesList.empty();
                    };
                },
                {
                    catalog:catalogCtrl.activeCat
                }
            );
        },
        saveCatAs:function(){
            catalogCtrl.controls.fileDialog.load_directory("$project$",function(){
                catalogCtrl.saveCat({
                    newFilename:{
                        path:catalogCtrl.controls.fileDialog.path,
                        filename:$('#'+catalogCtrl.controls.fileDialog.fileInput).val(),
                    },
                    confirmed:false
                });
            },
            buttons={
                "Save":function(){
                    catalogCtrl.controls.fileDialog.clickOpen();
                    $(this).dialog("close");
                },
                "Cancel":function(){
                    $(this).dialog("close");
                }
            });
        },
        saveSource:function(options){
            //console.log(catalogCtrl.srcInfo.source);
            catalogCtrl.controls.fitsviewer.jobsocket.sendTask({
                module:'catalog',
                task:'saveSource',
                parameters:$.extend(true,{
                    path:catalogCtrl.activeCat.path,
                    filename:catalogCtrl.activeCat.filename,
                    fileType:catalogCtrl.activeCat.fileType,
                    info:catalogCtrl.srcInfo.source
                },options)
            },
            function(result){
                if(result.id=='Error'){
                    alert(result.error);
                }else if(result.status=='saved'){
                    //console.log('Source saved successfully');
                    catalogCtrl.$changesList.append('<li>Updated star at x,y</li>');
                }else if(result.status=='failed'){
                    alert(result.reason);
                };
            });
        },
        removeSource:function(options){
            //console.log('source to remove:',catalogCtrl.srcInfo.source);
            var idIdx=catalogCtrl.srcInfo.source.fields.indexOf('id');
            ///console.log('id to remove:',catalogCtrl.srcInfo.source.info[idIdx]);
            catalogCtrl.controls.fitsviewer.jobsocket.sendTask(
                {
                    module:'catalog',
                    task:'removeSource',
                    parameters:$.extend(true,{
                        path:catalogCtrl.activeCat.path,
                        filename:catalogCtrl.activeCat.filename,
                        fileType:catalogCtrl.activeCat.fileType,
                        id:catalogCtrl.srcInfo.source.info[idIdx]
                    },options)
                },
                function(result,params){
                    if(result.id=='Error'){
                        alert(result.error);
                    }else if(result.status=='removed'){
                        //console.log('Source removed successfully');
                        var catalog=catalogCtrl.catalogs[params.index];
                        var srcIdx=-1;
                        for(var i=0;i<catalog.objects.length;i++){
                            var obj=catalog.objects[i];
                            if(obj.id==params.id){
                                srcIdx=i;
                            }
                        };
                        if(i>=0){
                            var precision=Astropyp.Pypelines.Fitsviewer.precision;
                            var x=Math.floor(catalog.objects[srcIdx].x*precision)/precision;
                            var y=Math.floor(catalog.objects[srcIdx].y*precision)/precision;
                            catalog.objects.splice(srcIdx,1);
                            catalog.layer.clear();
                            catalog.layer.draw();
                            catalogCtrl.$changesList.append('<li>Removed star at '+x+', '+y+'</li>');
                        };
                        catalogCtrl.srcInfo.$srcDiv.dialog('close');
                    }else if(result.status=='failed'){
                        alert(result.reason);
                    };
                },
                {
                    index:catalogCtrl.catalogs.indexOf(catalogCtrl.activeCat),
                    id:catalogCtrl.srcInfo.source.info[idIdx]
                }
            );
        },
        addSource:function(event){
            var catalog=catalogCtrl.activeCat;
            var plot=catalogCtrl.controls.surfacePlot;
            catalogCtrl.controls.fitsviewer.jobsocket.sendTask(
                {
                    module:'catalog',
                    task:'addSource',
                    parameters:{
                        path:catalog.path,
                        filename:catalog.filename,
                        fileType:catalog.fileType,
                        info:{
                            x:plot.x,
                            y:plot.y,
                            objType:'unknown'
                        },
                        fields:catalog.fields
                    }
                },
                function(result,params){
                    if(result.id=='Error'){
                        alert(result.error);
                    }else if(result.status=='added'){
                        //console.log('Source added successfully');
                        //console.log(result);
                        var catalog=params.catalog;
                        catalog.addSource(result.data);
                        catalog.layer.clear();
                        catalog.layer.draw();
                        controls.surfacePlot.$dialog.dialog('close');
                        catalogCtrl.$changesList.append('<li>Added star at '+params.x+', '+params.y+'</li>');
                    }else if(result.status=='failed'){
                        alert(result.reason);
                    };
                },
                {
                    catalog:catalog,
                    x:plot.x,
                    y:plot.y
                }
            );
        },
        buildCatalog:function(){
            var fitsviewer=catalogCtrl.controls.fitsviewer;
            var currentFits=fitsviewer.fitsFiles[fitsviewer.multiCanvas.current_frame.image.fileId];
            var detectParams=catalogCtrl.detect_list.getParams(catalogCtrl.detect_list.params);
            
            function string2array(mystring){
                var newArray=mystring.split('\n');
                for(var i=0; i<newArray.length; i++){
                    newArray[i]=newArray[i].split('').map(Number);
                };
                return newArray;
            };
            
            if(detectParams.hasOwnProperty('binStruct')){
                detectParams.binStruct=string2array(detectParams.binStruct);
            };
            if(detectParams.hasOwnProperty('maxima_footprint')){
                detectParams.maxima_footprint=string2array(detectParams.maxima_footprint);
            };
            if(detectParams.hasOwnProperty('aperture_radii')){
                detectParams.aperture_radii=[detectParams.aperture_radii];
                detectParams.aperture_radii[0][0]=Number(detectParams.aperture_radii[0][0])
            };
            
            console.log('detect list:',catalogCtrl.detect_list);
            console.log('detect params',detectParams);

            fitsviewer.jobsocket.sendTask(
                {
                    module:'fitsviewer',
                    task:'findStars',
                    parameters:{
                        fitsInfo:{
                            path:currentFits.path,
                            filename:currentFits.filename,
                            frame:fitsviewer.multiCanvas.current_frame.image.frame
                        },
                        catInfo:{
                            path:'/media/data-beta/users/fmooleka/astropyp/static/users/fred/projects',
                            filename:'test.npy'
                        },
                        detectParams:detectParams
                    }
                },
                function(result){
                    catalogCtrl.catViewer.onLoad(result.catResponse);
                    //if(result.saveResponse.status!='success'){
                    //    alert('Error saving new catalog');
                    //}
                }
            );
        }
    },params.ctrl);
    
    $catListAdd.click(function(){
        catalogCtrl.controls.fileDialog.load_directory("$project$",function(){
            catalogCtrl.catSelector.$selectDiv.dialog('open');
        });
    });
    
    // Source detection parameter dialog
    var $detectDiv=$('<div/>');
    var detect_list=Astropyp.Utils.initParamList({
        $div:$detectDiv,
        type:'div',
        params:Astropyp.Pypelines.Catalog.DetectionParams
    });
    $detectDiv.dialog({
        title:'Select Catalog Type',
        resizable:true,
        draggable:true,
        autoOpen:false,
        modal:true,
        buttons:{
            Detect:function(){
                catalogCtrl.buildCatalog();
                $(this).dialog("close");
            },
            "Close":function(){
                $(this).dialog("close");
            }
        }
    }).css("font-size", "12px");
    catalogCtrl.detect_list=detect_list;
    
    $catListDetect.click(function(){
        //catalogCtrl.buildCatalog();
        $detectDiv.dialog('open');
    })
    
    for(ctrl in ctrls){
        var $ctrl=$('<input/>')
            .prop('id','cat-ctrl-'+ctrl)
            .prop('type','image')
            .prop('class','smallButton catalog '+ctrls[ctrl]['class'])
            .prop('title',ctrls[ctrl].title)
            .prop('value','')
            .click(function(ctrl){
                return function(){
                    catalogCtrl.activeCtrl=ctrl;
                    //console.log(catalogCtrl.activeCtrl);
                }
            }(ctrl));
        $catCtrlDiv.append($ctrl);
    };
    
    $selector.change(catalogCtrl.catSelector.onSelect);
    $markerType.change(function(){
        var marker=Astropyp.Pypelines.Fitsviewer.Markers[$('#cat-marker-type').val()];
        if(catalogCtrl.activeCat!=null){
            catalogCtrl.changeMarker(catalogCtrl.activeCat,marker);
        };
        catalogCtrl.changeMarkerOptions(marker);
    })
    $markerType.change();
    $selectDiv.dialog({
        title:'Select Catalog Type',
        resizable:true,
        draggable:true,
        autoOpen:false,
        modal:true,
        buttons:{
            "Open":function(){
                catalogCtrl.catSelector.onOpen();
                $(this).dialog("close");
            },
            "Cancel":function(){
                $(this).dialog("close");
            }
        }
    }).css("font-size", "12px");
    
    $catDiv.dialog({
        title:'Object Catalogs',
        resizable:true,
        draggable:true,
        autoOpen:false,
        modal:false,
        buttons:{
            "Save":function(){
                return catalogCtrl.saveCat();
            },
            "Save as":function(){
                return catalogCtrl.saveCatAs();
            }
        }
    }).css("font-size", "12px");
    
    catalogCtrl.controls.events.mouseup.push({
        func:function(event){
            var catalogCtrl=controls.catalogCtrl;
            var catalog=catalogCtrl.activeCat;
            if(catalog!=null){
                if(catalogCtrl.activeCtrl=='info'){
                    catalogCtrl.getSourceInfo(event,catalog);
                }else if(catalogCtrl.activeCtrl=='addStar'){
                    controls.surfacePlot.center={
                        x:event.coords.x,
                        y:event.coords.y
                    };
                    var buttons=controls.surfacePlot.$dialog.dialog("option","buttons");
                    $.extend(true,buttons,{
                        'Add Source':function(){
                            return catalogCtrl.addSource(event)
                        }
                    });
                    //console.log('buttons:',buttons);
                    controls.surfacePlot.$dialog.dialog("option","buttons",buttons);
                    controls.surfacePlot.load();
                    controls.surfacePlot.active=true;
                    controls.surfacePlot.fit();
                }
            }
        },
        params:null
    });
    
    $srcDiv.dialog({
        title:'Point Source Info',
        resizable:true,
        draggable:true,
        autoOpen:false,
        modal:false,
        buttons:{
            "Save":function(){
                return catalogCtrl.saveSource();
            },
            "Remove":function(){
                return catalogCtrl.removeSource();
            }
        }
    }).css("font-size", "12px");
    
    return catalogCtrl;
};

console.log('catalog_controls.js loaded');