Astropyp.namespace('Astropyp.Pypelines.Plots');

Astropyp.Pypelines.Plots.dependencies = {
    jQuery_ui:{
        url:"static/jquery-ui-1.11.0/jquery-ui.min.js",
        isloaded:'$.ui',
        wait:true
    },
    jQuery_ui_css:{
        url:'static/jquery-ui-themes-1.11.0/themes/redmond/jquery-ui.min.css',
        wait:false
    },
    high_charts:{
        url:'static/Highcharts-3.0.10/js/highcharts.js',
        isloaded:'Highcharts',
        wait:true
    },
    high_charts_more:{
        url:'static/Highcharts-3.0.10/js/highcharts-more.js',
        isloaded:'Highcharts',
        wait:true
    },
    high_charts_export:{
        url:'static/Highcharts-3.0.10/js/modules/exporting.js',
        isloaded:'Highcharts',
        wait:true
    },
    plot_css:{
        url:'interactive_plots/static/plots.css',
        wait:false
    },
}

Astropyp.Pypelines.Plots.initParams = function(options){
    var formats = {};
    for(var i=0; i<Astropyp.Pypelines.Plots.Astropy_tbl_formats.length; i++){
        formats[Astropyp.Pypelines.Plots.Astropy_tbl_formats[i]] = Astropyp.Pypelines.Plots.Astropy_tbl_formats[i];
    }
    
    var params = {
        main: {
            plot_list_div:{
                type: 'div',
                legend: 'Plots',
                params:{
                    plot_list:{
                        type: 'list',
                        lbl: 'Plots',
                        radio: 'plots',
                        newItem: {
                            type: 'div',
                            params: {
                                plot_name: {
                                    lbl:'plot name',
                                },
                            }
                        }
                    },
                    edit: {
                        lbl:'',
                        type: 'button',
                        prop: {
                            innerHTML: 'edit'
                        },
                        func: {
                            click: function($edit_dialog){
                                return function(){
                                    $edit_dialog.dialog('open');
                                    var item_name = $('input[name='+params.main.plot_list_div.params.plot_list.radio+']:checked').val();
                                    console.log('selected:', item_name);
                                }
                            }(options.$edit_dialog)
                        }
                    },
                    fit: {
                        lbl:'',
                        type: 'button',
                        prop: {
                            innerHTML: 'fit',
                        },
                        func: {
                            click: function($fit_dialog){
                                return function(){
                                    $fit_dialog.dialog('open');
                                    var item_name = $('input[name='+params.main.plot_list_div.params.plot_list.radio+']:checked').val();
                                    console.log('selected:', item_name);
                                }
                            }(options.$fit_dialog)
                        }
                    },
                }
            },
            selection_type: {
                type: 'select',
                lbl: 'selection type',
                options: {
                    zoom: 'zoom to selection',
                    multiple: 'select multiple points'
                }
            },
            build_plot: {
                type: 'button',
                lbl:'',
                prop: {
                    innerHTML: 'Build'
                },
                func: {
                    click: options.buildPlotFunc
                }
            }
        },
        plot_params:{
            filename: {
                file_dialog: options.file_dialog,
            },
            format: {
                type: 'select',
                options: formats
            },
            load_file_btn: {
                type:'button',
                lbl:'',
                prop:{
                    innerHTML:'load astropy table'
                },
                func:{
                    click:options.loadFunc
                }
            },
            x_axis: {
                lbl: 'x-axis',
                type: 'select',
                options: {}
            },
            y_axis: {
                lbl: 'y-axis',
                type: 'select',
                options: {}
            },
            show_x_error_div: {
                type: 'conditional',
                params: {
                    show_x_error: {
                        lbl: 'show x-axis error bars',
                        prop: {
                            type: 'checkbox',
                            checked: false
                        }
                    }
                },
                paramSets: {
                    true: {
                        type: 'div',
                        params: {
                            x_error: {
                                type: 'select',
                                options: {}
                            }
                        }
                    },
                    false: {
                        type: 'div',
                        params: {}
                    }
                }
            },
            show_y_error_div: {
                type: 'conditional',
                params: {
                    show_y_error: {
                        lbl: 'show y-axis error bars',
                        prop: {
                            type: 'checkbox',
                            checked: false
                        }
                    }
                },
                paramSets: {
                    true: {
                        type: 'div',
                        params: {
                            y_error: {
                                type: 'select',
                                options: {}
                            }
                        }
                    },
                    false: {
                        type: 'div',
                        params: {}
                    }
                }
            },
            group_div: {
                type: 'conditional',
                params: {
                    group: {
                        lbl: 'group plots',
                        prop: {
                            type: 'checkbox',
                            checked: false
                        }
                    }
                },
                paramSets: {
                    true: {
                        type: 'div',
                        params: {
                            group_var: {
                                type: 'select',
                                lbl: 'field to group',
                                options: {}
                            }
                        }
                    },
                    false: {
                        type: 'div',
                        params: {}
                    }
                }
            },
            highcharts_div: {
                type: 'div',
                legend: 'Advanced Settings',
                params: {
                    edit_title_div: {
                        type: 'conditional',
                        params: {
                            edit_title: {
                                prop: {
                                    type: 'checkbox',
                                    checked: false
                                }
                            }
                        },
                        paramSets: {
                            true: {
                                type: 'div',
                                params: {
                                    name: {
                                        lbl: 'title'
                                    }
                                }
                            },
                            false: {
                                type: 'div',
                                params: {}
                            }
                        }
                    },
                    plot_type: {
                        type: 'select',
                        options: {
                            scatter: 'scatter plot',
                            line: 'line plot',
                            spline: 'curved line plot (spline)',
                            area: 'area plot',
                            areaspline: 'curved line area plot (areaspline)',
                            bar: 'horizontal bar chart',
                            column: 'vertical bar chart (column)',
                            pie: 'pie chart',
                            polar: 'polar chart',
                            //range: 'range series (not yet implemented)'
                        }
                    },
                    marker_div: {
                        type: 'div',
                        legend: 'Plot marker options',
                        params: {
                            fill_color_div:{
                                type: 'conditional',
                                params: {
                                    show_fill_color: {
                                        lbl: 'custom fill color',
                                        prop: {
                                            type: 'checkbox',
                                            checked: false
                                        }
                                    }
                                },
                                paramSets: {
                                    true: {
                                        type: 'div',
                                        params: {
                                            fillColor: {
                                                prop: {
                                                    value: 'rgba(100,10,10,.5)'
                                                }
                                            },
                                        }
                                    },
                                    false: {
                                        type: 'div',
                                        params: {}
                                    }
                                }
                            },
                            line_color_div: {
                                type: 'conditional',
                                params: {
                                    show_line_color: {
                                        lbl: 'custom line color',
                                        prop: {
                                            type: 'checkbox',
                                            checked: false
                                        }
                                    }
                                },
                                paramSets: {
                                    true: {
                                        type: 'div',
                                        params: {
                                            lineColor: {
                                                prop: {
                                                    value: 'rgb(100,10,10)'
                                                }
                                            },
                                        }
                                    },
                                    false: {
                                        type: 'div',
                                        prop: {}
                                    }
                                }
                            },
                            lineWidth: {
                                prop: {
                                    value: 1
                                }
                            },
                            symbol: {
                                type: 'select',
                                options: {
                                    circle: 'circle',
                                    square: 'square',
                                    diamond: 'diamond',
                                    triangle: 'triangle',
                                    'triangle-down': 'upside down triangle'
                                }
                            },
                            radius: {
                                prop: {
                                    value: 4
                                }
                            },
                            enabled: {
                                prop: {
                                    type: 'checkbox',
                                    checked: true
                                }
                            }
                        }
                    }
                }
            }
        },
        fit_params: {
            model_div: {
                type: 'conditional',
                params: {
                    model: {
                        type: 'select',
                        options: {
                            polynomial: 'polynomial',
                            gaussian: 'gaussian',
                            exponential: 'exponential',
                        }
                    }
                },
                paramSets: {
                    polynomial: {
                        type: 'div',
                        params: {
                            order: {
                                prop: {
                                    type: 'number',
                                    value: 2
                                }
                            },
                            coefficients: {
                                lbl: 'initial guess (coefficients)',
                                prop: {
                                    value: '0,1,1'
                                }
                            }
                        }
                    },
                    gaussian: {
                        type: 'div',
                        params: {
                            mean: {
                                prop: {
                                    type: 'number',
                                    value: 0
                                }
                            },
                            std_dev: {
                                lbl: 'standard deviation',
                                prop: {
                                    type: 'number',
                                    value: 1
                                }
                            },
                            amplitude: {
                                prop: {
                                    type: 'number',
                                    value: 1
                                }
                            },
                            floor: {
                                prop: {
                                    type: 'number',
                                    value: 0
                                }
                            }
                        }
                    }
                }
            },
            fit_type: {
                type: 'select',
                options: {
                    linearLSQ: 'linear least squares',
                    levMarLSQ: 'Levenberg-Marquardt LSQ',
                    SLSQPLSQ: 'SLSQP least squares',
                    simplexLSQ: 'simplex least squares'
                }
            }
        }
    };
    
    return params;
}

Astropyp.Pypelines.Plots.Astropy_tbl_formats = [
    'ascii', 'ascii.aastex', 'ascii.basic', 'ascii.cds', 'ascii.commented_header',
    'ascii.daophot', 'ascii.fixed_width', 'ascii.fixed_width_no_header', 'ascii.html', 
    'ascii.fixed_width_two_line', 'ascii.ipac', 'ascii.latex', 'ascii.no_header',
    'ascii.rdb', 'ascii.sextractor', 'ascii.tab', 'ascii.csv', 'cds', 'daophot',
    'fits', 'hd5', 'html', 'ipac', 'latex', 'rdb', 'votable', 'npy'
]
