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
    plot_css:{
        url:'interactive_plots/static/plots.css',
        wait:false
    },
}

Astropyp.Pypelines.Plots.initParams = function(options){
    var params = {
        scatter:{
            filename: {
                file_dialog: options.file_dialog,
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
            show_btn: {
                type:'button',
                lbl:'',
                prop:{
                    innerHTML:'build plot'
                },
                func:{
                    click:options.buildPlotFunc
                }
            }
        }
    };
    
    return params;
}