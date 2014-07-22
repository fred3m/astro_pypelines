Astropyp.namespace('Astropyp.Pypelines.Template');

Astropyp.Pypelines.Template.dependencies = {
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
    template_css:{
        url:'pypeline-template/static/template_styles.css',
        wait:false
    },
}

Astropyp.Pypelines.Template.getParameters = function(options){
    var stored_dirs = {};
    for(var dir in options.stored_dirs){
        if(dir != 'session'){
            stored_dirs[dir] = {
                prop: {
                    value: options.stored_dirs[dir],
                    size: 80
                },
            }
        }
    };
    
    var params ={
        step1:{
            'This is a text input':{},
            subset1:{
                type:'div',
                legend:'This set of parameters is grouped together',
                params:{
                    height:{
                        lbl:'This is a number input (you can move the number up or down)',
                        prop:{
                            type:'number',
                            min:0,
                            max:10
                        }
                    },
                    colors:{
                        type:'select',
                        lbl:'Select a color:',
                        options:{
                            red:'Red',
                            green:'Green',
                            blue:'Blue'
                        },
                        defaultVal:'green'
                    },
                }
            },
            subset2:{
                type:'conditional',
                params:{
                    finished:{
                        lbl:'Show additional options',
                        prop:{
                            type:'checkbox',
                            'checked':true
                        }
                    },
                },
                paramSets:{
                    true:{
                        legend:'This is a conditional set, only shown when the box is checked',
                        type:'div',
                        params:{
                            name:{
                                lbl:'Name',
                            },
                            Age:{
                                prop:{
                                    type:'number',
                                    min:18,
                                    max:100,
                                    value:18
                                }
                            }
                        }
                    },
                    false:{}
                }
            },
            subset3:{
                type:'conditional',
                params:{
                    show:{
                        type:'select',
                        lbl:'You can also do conditional parameters based on a selection',
                        options:{
                            parents:'Parents names',
                            children:'Childrens knicknames'
                        },
                        defaultVal:'children'
                    }
                },
                paramSets:{
                    parents:{
                        type:'div',
                        legend:'You chose parents names',
                        params:{
                            mom:{},
                            dad:{},
                        }
                    },
                    children:{
                        type:'div',
                        legend:'You chose childrens knicknames',
                        divClass:'short-div',
                        params:{
                            Bobby:{},
                            Tracy:{},
                        }
                    }
                }
            },
            subset4: {
                type: 'div',
                legend: 'You can also make an editable list of options',
                css: {
                    'width': 300
                },
                params: {
                    stored_dirs: {
                        type: 'list',
                        radio: 'stored_dirs',
                        items: stored_dirs,
                        key_name: 'stored_dir-',
                        newItem: {
                            type: 'div',
                            params: {
                                path_name: {
                                    lbl:'directory label'
                                },
                                path: {
                                    prop: {
                                        size: 80
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    return params[options.step];
}