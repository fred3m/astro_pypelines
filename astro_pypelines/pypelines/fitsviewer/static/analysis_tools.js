Astropyp.Pypelines.Fitsviewer.initPlotWindow=function(options){
    var utils=Astropyp.Utils;
    var fitsPyp=Astropyp.Pypelines.Fitsviewer;
    if(!utils.check4key(options,['fitsviewer','plotType','element'],"initPlot window requires ")){
        return;
    };
    var fitsviewer=options.fitsviewer;
    var dataType='';
    var $div=$('<div/>');
    if(options.plotType=='surfacePlot'){
        dataType='viewer-surfacePlot';
        $div.prop('id','surface-dialog').prop('title','Surface Plot')
    }else if(options.plotType=='histogram'){
        dataType='viewer-histogram';
        $div.prop('id','hist-dialog').prop('title','Pixel Value Distribution')
    };
    $('body').append($div);
    var plot=utils.initPlotWindow(options);
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
            plot.x=x;
            plot.y=y;
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
        plot.fit=function(){
            var image=fitsviewer.multiCanvas.current_frame.image;
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
        };
        $.extend(true,buttons,{
            'Fit data':plot.fit
        });
        var tbl=utils.addElement(div,'table',[['id','surfaceFitParams']]);
        plot.tblName='surfaceFitParams';
        var row=tbl.insertRow(0);
        var cell1=row.insertCell(0);
        var cell2=row.insertCell(1);
        cell1.innerHTML="Coordinates: ";
        plotDialog.dialog("option","buttons",buttons);
        plot.$dialog=plotDialog;
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
            var image=fitsviewer.multiCanvas.current_frame.image;
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

console.log('analysis_tools.js loaded');