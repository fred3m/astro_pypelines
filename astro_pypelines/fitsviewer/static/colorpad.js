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
    var $colorCtrl=$('<div/>').prop('id',options.element).prop('title','Colormap Controls');
    var $colorSelect=$('<div/>').prop('id','colormap-selector').prop('title','Color Functions');
    $('body').append($colorCtrl);
    $('body').append($colorSelect);
    
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

console.log('colorpad.js loaded');