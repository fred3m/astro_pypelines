// catalog.js
// Catalog parameters for astropyp
// Copyright 2014 by Fred Moolekamp
// License: GPLv3

Astropyp.namespace('Astropyp.Pypelines.Catalog');

Astropyp.Pypelines.Catalog.DetectionParams={
    maxima:{
        type:'conditional',
        params:{
            apertureType:{
                type:'select',
                lbl:'Maximum aperture type',
                options:{
                    width:'width',
                    radius:'radius',
                    footprint:'footprint'
                },
                title:'Aperture centered on each point to find its maximum',
                defaultVal:'radius'
            }
        },
        paramSets:{
            width:{
                type:'div',
                params:{
                    maxima_size:{
                        lbl:'width',
                        prop:{
                            type:'number',
                            min:1,
                            value:11
                        },
                        units:['px']
                    },
                }
            },
            radius:{
                type:'div',
                params:{
                    maxima_radius:{
                        lbl:'radius',
                        prop:{
                            type:'number',
                            min:1,
                            value:5
                        },
                        units:['px']
                    }
                }
            },
            footprint:{
                type:'div',
                params:{
                    maxima_footprint:{
                        lbl:'footprint',
                        type:'textarea',
                        prop:{
                            cols:11,
                            rows:11,
                            value:'00000100000\n00001110000\n00011111000\n00111111100\n11111111111\n00111111100\n00011111000\n00001110000\n00000100000'
                        }
                    }
                }
            }
        }
    },
    maxima_sigma:{
        lbl:'gaussian smoothing sigma',
        prop:{
            type:'number',
            min:0,
            value:2
        },
        title:'Standard deviation used for gaussian smoothing function (larger sigma is more blurry)'
    },
    aperture:{
        type:'conditional',
        params:{
            auto_aperture:{
                lbl:'Calculate aperature radius automatically',
                prop:{
                    type:'checkbox',
                    checked:true,
                }
            }
        },
        paramSets:{
            true:{},
            false:{
                params:{
                    aperture_radii:{
                        lbl:'aperture radii',
                        prop:{
                            value:5
                        },
                        units:['px','deg','arc min','arc sec'],
                        title:'this should be a list of comma separated numbers (currently only one aperture is supported)'
                    }
                }
            }
        }
    },
    threshold:{
        type:'conditional',
        params:{
            auto_thresh:{
                lbl:'Calculate threshold automatically',
                prop:{
                    type:'checkbox',
                    checked:true
                },
            }
        },
        paramSets:{
            true:{},
            false:{
                params:{
                    threshold:{
                        prop:{
                            type:'number',
                            value:19
                        },
                        units:['counts'],
                        title:'minimum value for a valid signal'
                    }
                }
            }
        }
    },
    saturate:{
        type:'conditional',
        params:{
            saturation_method:{
                lbl:'Method to calculate saturation',
                type:'select',
                options:{
                    fitsHeader:'FITS header keyword',
                    userSpecify:'User specify',
                    none:'No saturation point'
                }
            }
        },
        paramSets:{
            fitsHeader:{
                params:{
                    saturate_key:{
                        lbl:'Saturation keyword',
                        prop:{
                            value:'SATURATE'
                        },
                        title:'keyword in FITS header for saturation'
                    }
                }
            },
            userSpecify:{
                params:{
                    saturation:{
                        prop:{
                            type:'number',
                            value:50000
                        },
                        units:['counts'],
                        title:'maximum value of pixel before ccd becomes non-linear'
                    }
                }
            },
            none:{}
        }
    },
    margin:{
        type:'conditional',
        params:{
            auto_margin:{
                lbl:'set margin to aperture radius',
                prop:{
                    type:'checkbox',
                    checked:true
                }
            }
        },
        paramSets:{
            true:{},
            false:{
                params:{
                    margin:{
                        prop:{
                            type:'number',
                            min:0,
                            value:5
                        },
                        units:['px'],
                        title:'number of pixels from the edge ignored during object detection'
                    }
                }
            }
        }
    },
    binStruct:{
        type:'conditional',
        params:{
            auto_binStruct:{
                lbl:'Use default binary structure',
                prop:{
                    type:'checkbox',
                    checked:true
                }
            }
        },
        paramSets:{
            true:{},
            false:{
                params:{
                    binStruct:{
                        lbl:'binary structure',
                        type:'textarea',
                        prop:{
                            cols:'4',
                            rows:'4',
                            value:'010\n111\n010',
                        },
                        title:'minimum structure all sources are shrunk down to for source detection (recommended to use default)'
                    }
                }
            }
        }
    },
    fit_method:{
        lbl:'Fit method',
        type:'select',
        options:{
            'no fit':'no fit',
            'circular gaussian':'circular gaussian',
            'elliptical gaussian':'elliptical gaussian',
            'circular moffat':'circular moffat',
            'elliptical moffat':'elliptical moffat',
        },
        title:'function to fit maxima to ',
        defaultVal:'circular moffat'
    },
    filter:{
        type:'conditional',
        params:{
            use_filter:{
                lbl:'Filter sources',
                prop:{
                    type:'checkbox',
                    checked:false
                }
            }
        },
        paramSets:{
            true:{
                type:'conditional',
                params:{
                    filter_var:{
                        type:'select',
                        lbl:'Filter variable',
                        options:{
                            beta:'beta',
                            fwhm:'fwhm',
                            ratio:'fwhm_1/fwhm_2'
                        },
                        defaultVal:'beta'
                    }
                },
                paramSets:{
                    beta:{
                        type:'div',
                        legend:'beta range',
                        params:{
                            filter_min:{
                                lbl:'min',
                                prop:{
                                    type:'number',
                                    value:2
                                }
                            },
                            filter_max:{
                                lbl:'max',
                                prop:{
                                    type:'number',
                                    value:50
                                }
                            }
                        }
                    },
                    fwhm:{
                        type:'div',
                        legend:'fwhm range',
                        params:{
                            filter_min:{
                                lbl:'min',
                                prop:{
                                    type:'number',
                                    value:2
                                }
                            },
                            filter_max:{
                                lbl:'max',
                                prop:{
                                    type:'number',
                                    value:20
                                }
                            }
                        }
                    },
                    ratio:{}
                }
            },
            false:{}
        }
    }
};