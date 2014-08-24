/**
 * utils.js holds methods commonly used by the example graphs in the sonic.js/examples folder
 */

/**
 * Generates random tree data
 */
function createTreeData () {
    var depth = Math.ceil(Math.random() * 4),
        tree = {
            name: 'Root',
            group: 0,
            children: []
        };
    d3.range(depth).forEach(function (d, bi) {
        var numNodes = Math.ceil(Math.random() * 4);
        d3.range(numNodes).forEach(function (nn, i) {
            var ts = findChildrenAtDepth(tree, bi);
            ts.forEach(function (c, ni) {
                var pt = {
                    id: (bi + 1) * numNodes + (i+1) * ts.length + ni,
                    name: 'Node' + ((bi + 1) * numNodes + (i+1) * ts.length + ni),
                    group: bi
                }
                if (bi !== depth - 1) {
                    pt.children = [];
                } else {
                    pt.size = Math.ceil(Math.random() * 200);
                }
                c.push(pt);
            });
        });
    });



    return [tree];
}

function findChildrenAtDepth(tree, d) {
    var cArry = [];
    if (d === 0) {
        cArry.push(tree.children);
    }
    if (d === 1) {
     tree.children.forEach(function (c) {
        cArry.push(c.children);
     });
    }
    if (d === 2) {
        tree.children.forEach(function (c) {
            c.children.forEach(function (c) {
                cArry.push(c.children);
            })
        })
    }
    if (d === 3) {
        tree.children.forEach(function (c) {
            c.children.forEach(function (c) {
                c.children.forEach(function (c) {
                    cArry.push(c.children);
                });
            })
        })
    }
    if (d === 4) {
        tree.children.forEach(function (c) {
            c.children.forEach(function (c) {
                c.children.forEach(function (c) {
                    c.children.forEach(function (c) {
                        cArry.push(c.children);
                    });
                });
            })
        });
    }
    if (d === 5) {
        tree.children.forEach(function (c) {
            c.children.forEach(function (c) {
                c.children.forEach(function (c) {
                    c.children.forEach(function (c) {
                        c.children.forEach(function (c) {
                            cArry.push(c.children);
                        })
                    });
                });
            })
        });
    }
    return cArry;
}

/**
 * Create a random series of points
 */
function createPoints(type, numSeries, opts) {
    var pointGenerator;

    type = type || 'time';
    pointGenerator = window['create' + sonic.capFirstLetter(type) + 'Point'];
    opts = opts || {};

    return d3.range(0, numSeries || 3).map(function (s) {
        if (!opts.numPoints) {
            opts.numPoints = Math.floor(Math.random() * 100);
        }
        return {
            key: s,
            values: d3.range(0, opts.numPoints).map(function (i) {
                return pointGenerator.call(pointGenerator, s, i, opts);
            })
        };
    });
}

function createHeatPoints(numSeries) {
    return d3.range(0, numSeries || 1).map(function (s) {
        var step = 5,
            data = {
                key: s,
                values: []
            },
            xVals = Math.random() * 25 + 15,
            yVals = Math.random() * 25 + 15;

        d3.range(0, Math.floor(xVals)).forEach(function (x, xi) {
            d3.range(0, Math.floor(yVals)).forEach(function (y, yi) {
                data.values.push({
                    x: step * xi,
                    x2: step * (xi + 1),
                    y: step * yi,
                    y2: step * (yi + 1),
                    z: Math.random() * 100
                });
            });
        });

        return data;
    });
}

function getImageNodes() {
    return [
        {id: 0, name: 'Jack Smith', height: 40, width: 40, image: "images/person-blue.png", highlightImage: "images/person-red.png", locationOffset: {x:0, y:0}},
        {id: 1, name: 'Mary Martin', height: 30, width: 30, image: "images/person-black.png", highlightImage: "images/person-red.png"},
        {id: 2, name: 'London, England', height: 30, width: 30, image: "images/location-black.png", highlightImage: "images/location-red.png"},
        {id: 3, name: 'Lisa Simpson', height: 30, width: 30, image: "images/person-black.png", highlightImage: "images/person-red.png"},
        {id: 4, name: 'London Tower', height: 30, width: 30, image: "images/location-black.png", highlightImage: "images/location-red.png"},
        {id: 5, name: 'Hanz Ferdinand', height: 30, width: 30, image: "images/person-black.png", highlightImage: "images/person-red.png"},
        {id: 6, name: 'Fred Flinstone', height: 30, width: 30, image: "images/person-black.png", highlightImage: "images/person-red.png"},
        {id: 7, name: 'Bart Simpson', height: 30, width: 30, image: "images/person-black.png", highlightImage: "images/person-red.png"},
        {id: 8, name: 'Jennifer Jones', height: 30, width: 30, image: "images/person-black.png", highlightImage: "images/person-red.png"},
        {id: 9, name: 'Bob Barker', height: 30, width: 30, image: "images/person-black.png", highlightImage: "images/person-red.png"}
    ];
}

function getImageLinks() {
    return links = [
        {source:0, target: 1},
        {source:0, target: 2},
        {source:0, target: 3},
        {source:0, target: 4},
        {source:0, target: 5},
        {source:0, target: 6},
        {source:0, target: 7},
        {source:6, target: 5},
        {source:6, target: 7},
        {source:1, target: 3},
        {source:8, target: 7},
        {source:0, target: 8},
        {source:5, target: 8},
        {source:1, target: 8},
        {source:0, target: 9},
        {source:5, target: 9},
        {source:8, target: 9}
  ];
}

function getCircleNodes() {
    return [
        {id: 100, name: 'Jack S', radius: 15, group: 2, locationOffset: {x:0, y:0}},
        {id: 101, name: 'Mary M', radius: 10, group: 0},
        {id: 102, name: 'London, Eng', radius: 10, group: 1},
        {id: 103, name: 'Lisa S', radius: 10, group: 0},
        {id: 104, name: 'LondonTower', radius: 10, group: 1},
        {id: 105, name: 'Hanz F', radius: 10, group: 0},
        {id: 106, name: 'Fred F', radius: 10, group: 0},
        {id: 107, name: 'Bart S', radius: 10, group: 0},
        {id: 108, name: 'Jennifer J', radius: 10, group: 0},
        {id: 109, name: 'Bob B', radius: 10, group: 0}
  ];
}

function getCircleLinks() {
    return [
        {source:100, target: 101},
        {source:100, target: 102},
        {source:100, target: 103},
        {source:100, target: 104},
        {source:100, target: 105},
        {source:100, target: 106},
        {source:100, target: 107},
        {source:106, target: 105},
        {source:106, target: 107},
        {source:101, target: 103},
        {source:108, target: 107},
        {source:100, target: 108},
        {source:105, target: 108},
        {source:101, target: 108},
        {source:100, target: 109},
        {source:105, target: 109},
        {source:108, target: 109}
    ];
}

function getNetworkTreeData() {
    return [{
       name: "ROOT",
       group: 0,
       id: 1,
       children: [
           {
               name: 'Node1',
               id: 2,
               group: 1,
               children: [
                   {
                       name: 'Node2',
                       id: 3,
                       group: 1,
                       children: [
                           {
                               name: 'Node3',
                               id: 4,
                               group: 1,
                               size: 10
                           },
                           {
                               name: 'Node4',
                               id: 5,
                               group: 1,
                               size: 15
                           },
                           {
                               name: 'Node5',
                               id: 6,
                               group: 1,
                               size: 25
                           }
                       ]
                   },
                   {
                       name: 'Node6',
                       id: 7,
                       group: 1,
                       size: 10
                   },
                   {
                       name: 'Node7',
                       id: 8,
                       group: 1,
                       size: 25
                   }
               ]
           },
           {
               name: 'Node8',
               id: 9,
               group: 2,
               children: [
                   {
                       name: 'Node9',
                       id: 10,
                       group: 2,
                       size: 15
                   },
                   {
                       name: 'Node10',
                       id: 11,
                       group: 2,
                       size: 20
                   },
                   {
                       name: 'Node11',
                       id: 12,
                       group: 2,
                       size: 15
                   }
               ]
           },
           {
               name: 'Node12',
               id: 13,
               group: 3,
               children: [
                   {
                       name: 'Node13',
                       id: 14,
                       group: 3,
                       size: 15
                   },
                   {
                       name: 'Node14',
                       id: 15,
                       group: 3,
                       size: 20
                   },
                   {
                       name: 'Node15',
                       id: 16,
                       group: 3,
                       size: 15
                   }
               ]
           },
           {
               name: 'Node16',
               id: 17,
               group: 4,
               children: [
                   {
                       name: 'Node17',
                       id: 18,
                       group: 4,
                       size: 15
                   },
                   {
                       name: 'Node18',
                       id: 19,
                       group: 4,
                       size: 20
                   },
                   {
                       name: 'Node19',
                       id: 20,
                       group: 4,
                       size: 15
                   }
               ]
           }
       ]
    }];
}

function createHPieData () {
    return [
        {
            "name": "Aromas",
            "children": [
                {
                    "name": "Enzymatic",
                    "children": [
                        {
                            "name": "Flowery",
                            "children": [
                                {
                                    "name": "Floral",
                                    "children": [
                                        {
                                            "name": "Coffee Blossom", "color": "#f9f0ab", size: 10 * Math.random()
                                        },
                                        {
                                            "name": "Tea Rose", "color": "#e8e596", size: 10 * Math.random()
                                        }
                                    ]
                                },
                                {
                                    "name": "Fragrant",
                                    "children": [
                                        {
                                            "name": "Cardamon Caraway", "color": "#f0e2a3", size: 10 * Math.random()
                                        },
                                        {
                                            "name": "Coriander Seeds", "color": "#ede487", size: 10 * Math.random()
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "name": "Fruity",
                            "children": [
                                {
                                    "name": "Citrus",
                                    "children": [
                                        {
                                            "name": "Lemon", "color": "#efd580", size: 10 * Math.random()
                                        },
                                        {
                                            "name": "Apple", "color": "#f1cb82", size: 10 * Math.random()
                                        }
                                    ]
                                },
                                {
                                    "name": "Berry-like",
                                    "children": [
                                        {
                                            "name": "Apricot", "color": "#f1c298", size: 10 * Math.random()
                                        },
                                        {
                                            "name": "Blackberry", "color": "#e8b598", size: 10 * Math.random()
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "name": "Herby",
                            "children": [
                                {
                                    "name": "Alliaceous",
                                    "children": [
                                        {
                                            "name": "Onion", "color": "#d5dda1", size: 10 * Math.random()
                                        },
                                        {
                                            "name": "Garlic", "color": "#c9d2b5", size: 10 * Math.random()
                                        }
                                    ]
                                },
                                {
                                    "name": "Leguminous",
                                    "children": [
                                        {
                                            "name": "Cucumber", "color": "#aec1ad", size: 10 * Math.random()
                                        },
                                        {
                                            "name": "Garden Peas", "color": "#a7b8a8", size: 10 * Math.random()
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Sugar Browning",
                    "children": [
                        {
                            "name": "Nutty",
                            "children": [
                                {
                                    "name": "Nut-like",
                                    "children": [
                                        {
                                            "name": "Roasted Peanuts", "color": "#b49a3d", size: 10 * Math.random()
                                        },
                                        {
                                            "name": "Walnuts", "color": "#b28647", size: 10 * Math.random()
                                        }
                                    ]
                                },
                                {
                                    "name": "Malt-like",
                                    "children": [
                                        {
                                            "name": "Balsamic Rice", "color": "#a97d32", size: 10 * Math.random()
                                        },
                                        {
                                            "name": "Toast", "color": "#b68334", size: 10 * Math.random()
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "name": "Carmelly",
                            "children": [
                                {
                                    "name": "Candy-like",
                                    "children": [
                                        {
                                            "name": "Roasted Hazelnut", "color": "#d6a680", size: 10 * Math.random()
                                        },
                                        {
                                            "name": "Roasted Almond", "color": "#dfad70", size: 10 * Math.random()
                                        }
                                    ]
                                },
                                {
                                    "name": "Syrup-like",
                                    "children": [
                                        {
                                            "name": "Honey", "color": "#a2765d", size: 10 * Math.random()
                                        },
                                        {
                                            "name": "Maple Syrup", "color": "#9f6652", size: 10 * Math.random()
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "name": "Chocolatey",
                            "children": [
                                {
                                    "name": "Chocolate-like",
                                    "children": [
                                        {
                                            "name": "Bakers", "color": "#b9763f", size: 10 * Math.random()
                                        },
                                        {
                                            "name": "Dark Chocolate", "color": "#bf6e5d", size: 10 * Math.random()
                                        }
                                    ]
                                },
                                {
                                    "name": "Vanilla-like",
                                    "children": [
                                        {
                                            "name": "Swiss", "color": "#af643c", size: 10 * Math.random()
                                        },
                                        {
                                            "name": "Butter", "color": "#9b4c3f", size: 10 * Math.random()
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Dry Distillation",
                    "children": [
                        {
                            "name": "Resinous",
                            "children": [
                                {
                                    "name": "Turpeny",
                                    "children": [
                                        {
                                            "name": "Piney", "color": "#72659d", size: 10 * Math.random()
                                        },
                                        {
                                            "name": "Blackcurrant-like", "color": "#8a6e9e", size: 10 * Math.random()
                                        }
                                    ]
                                },
                                {
                                    "name": "Medicinal",
                                    "children": [
                                        {
                                            "name": "Camphoric", "color": "#8f5c85", size: 10 * Math.random()
                                        },
                                        {
                                            "name": "Cineolic", "color": "#934b8b", size: 10 * Math.random()
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "name": "Spicy",
                            "children": [
                                {
                                    "name": "Warming",
                                    "children": [
                                        {
                                            "name": "Cedar", "color": "#9d4e87", size: 10 * Math.random()
                                        },
                                        {
                                            "name": "Pepper", "color": "#92538c", size: 10 * Math.random()
                                        }
                                    ]
                                },
                                {
                                    "name": "Pungent",
                                    "children": [
                                        {
                                            "name": "Clove", "color": "#8b6397", size: 10 * Math.random()
                                        },
                                        {
                                            "name": "Thyme", "color": "#716084", size: 10 * Math.random()
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "name": "Carbony",
                            "children": [
                                {
                                    "name": "Smokey",
                                    "children": [
                                        {
                                            "name": "Tarry", "color": "#2e6093", size: 10 * Math.random()
                                        },
                                        {
                                            "name": "Pipe Tobacco", "color": "#3a5988", size: 10 * Math.random()
                                        }
                                    ]
                                },
                                {
                                    "name": "Ashy",
                                    "children": [
                                        {
                                            "name": "Burnt", "color": "#4a5072", size: 10 * Math.random()
                                        },
                                        {
                                            "name": "Charred", "color": "#393e64", size: 10 * Math.random()
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "name": "Tastes",
            "children": [
                {
                    "name": "Bitter",
                    "children": [
                        {
                            "name": "Pungent",
                            "children": [
                                {
                                    "name": "Creosol", "color": "#aaa1cc", size: 10 * Math.random()
                                },
                                {
                                    "name": "Phenolic", "color": "#e0b5c9", size: 10 * Math.random()
                                }
                            ]
                        },
                        {
                            "name": "Harsh",
                            "children": [
                                {
                                    "name": "Caustic", "color": "#e098b0", size: 10 * Math.random()
                                },
                                {
                                    "name": "Alkaline", "color": "#ee82a2", size: 10 * Math.random()
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Salt",
                    "children": [
                        {
                            "name": "Sharp",
                            "children": [
                                {
                                    "name": "Astringent", "color": "#ef91ac", size: 10 * Math.random()
                                },
                                {
                                    "name": "Rough", "color": "#eda994", size: 10 * Math.random()
                                }
                            ]
                        },
                        {
                            "name": "Bland",
                            "children": [
                                {
                                    "name": "Neutral", "color": "#eeb798", size: 10 * Math.random()
                                },
                                {
                                    "name": "Soft", "color": "#ecc099", size: 10 * Math.random()
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Sweet",
                    "children": [
                        {
                            "name": "Mellow",
                            "children": [
                                {
                                    "name": "Delicate", "color": "#f6d5aa", size: 10 * Math.random()
                                },
                                {
                                    "name": "Mild", "color": "#f0d48a", size: 10 * Math.random()
                                }
                            ]
                        },
                        {
                            "name": "Acidy",
                            "children": [
                                {
                                    "name": "Nippy", "color": "#efd95f", size: 10 * Math.random()
                                },
                                {
                                    "name": "Piquant", "color": "#eee469", size: 10 * Math.random()
                                }
                            ]
                        }
                     ]
                },
                {
                    "name": "Sour",
                    "children": [
                        {
                            "name": "Winey",
                            "children": [
                                {
                                    "name": "Tangy", "color": "#dbdc7f", size: 10 * Math.random()
                                },
                                {
                                    "name": "Tart", "color": "#dfd961", size: 10 * Math.random()
                                }
                            ]
                        },
                        {
                            "name": "Soury",
                            "children": [
                                {
                                    "name": "Hard", "color": "#ebe378", size: 10 * Math.random()
                                },
                                {
                                    "name": "Acrid", "color": "#f5e351", size: 10 * Math.random()
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ];
}

/**
 * Sorts data into 3 seriesKeys: ['a','b','c'] and then returns
 * updated data.
 */
function sortToKeys(data) {
    var r;
    r = data.map(function (s, i) {
        if (i === 0) {
            s.key = 'a';
        } else if (i === 1) {
            s.key = 'b';
        } else {
            s.key = 'c';
        }
        return s;
    });
    return r;
}

/**
 * Creates a random network node
 */
function createNetworkNodePoint(key, idx, opts) {
    var numGroups = opts.numGroups || 5; //number of groups

    return {
        id: idx,
        name: 'Node ' + idx,
        group: Math.floor(idx * numGroups / opts.numPoints)
    };
}

/**
 * Creates a network link
 */
function createNetworkLinkPoint(key, idx, opts) {
    var s = Math.floor(Math.random() * (opts.numPoints - 1)),
        t = Math.floor(Math.random() * (opts.numPoints - 1)),
        w = Math.floor(Math.random() * (opts.maxWeight || 100));
    if (s === t) {
        if (s === opts.numPoints - 1) {
            t = t - 1;
        } else {
            t = t + 1;
        }
    }
    return {
        source: s,
        target: t,
        weight: w,
        left: Math.random() > 0.5,
        right: Math.random() > 0.5
    };
}

/**
 * Create a random time series point
 */
function createTimePoint(s, i, opts) {
    var date = randomizeDateBack();
    return {
        id: date,
        x: date,
        y: randomizeCount(opts),
        y2: randomizeCount(opts)
    };
}

function createConsistentTimePoint (s, i, opts) {
    var date = dateByIndex(i);
    return {
        id: date,
        x: date,
        y: randomizeCount(),
        y2: randomizeCount()
    };
}

/**
 * Create randomized time span point
 */
function createTimeSpanPoint(s, i, opts) {
    var point = {},
        date = randomizeDateBack();

    point = {
        id: s + '-' + i,
        x: date,
        x2: randomizeOffsetDate(date),
        y: randomizeCount()
    };

    return point;
}

/*
 * Create randomized X/Y with groups
 */
function createXYPoint(s, i, opts) {
    var point = {
        id: s + '-' + i,
        x: randomizeCount(),
        y: randomizeCount()
    };

    if (opts.symbol) {
        point.type = randomizeSymbolType();
        point.size = randomizeSymbolSize();
    }

    return point;
}

/**
 * Create a random point for a significance bar chart
 */
function createSignificancePoint() {
    var date = randomizeDateBack();
    var group = randomizeGroup();
    return {
        id: date,
        x: date,
        y: group,
        z: randomizePercent(),
        group: group
    };
}

/**
 * Create a random group point for a donut graph
 */
function createGroupPoint() {
    return {
        group: randomizeGroup(),
        y: randomizeCount()
    };
}

/**
 * Create points based off faceting by group
 *
 * @todo combine with createPoint stuff above, and also
 * abstract to be a general faceting util fn
 */
function createGroupPoints() {
    var data = createPoints("Group"),
        nest = d3.nest()
            .key(function (d) { return d.group; });

    return data.map(function (s) {
        s.values = nest.entries(s.values)
            .sort(sonic.sortByProp('key'))
            .map(function (d) {
                return {
                    id: d.key,
                    x: d.key,
                    y: d.values.reduce(function (prev, curr) {
                        return prev + curr.y;
                    }, 0)
                };
            });
        return s;
    });
}

/**
 * Create points that aggregate a y value based
 * off of other generated points
 *
 * @todo combine into a createPoint function like above
 */
function createAggregatePoints() {
    return createPoints("XY").map(function (s) {
        return {
            id: s.key,
            y: s.values.reduce(function (prev, curr) {
                return prev + curr.y;
            }, 0)
        };
    });
}

/**
 * Create points with x and y buckets, with a z value
 *
 * @todo combine into a createPoint function like above
 */
function createMatrixPoints(numX, numY, mean, sd) {
    var randomizer;

    numX = numX || 24;
    numY = numY || 7;
    mean = mean || 50;
    sd = sd || 25;

    randomizer = d3.random.normal(mean, sd);

    return d3.range(0, numX + 1).map(function (s, i) {
        return {
            key: s,
            values: d3.range(0, numY + 1).map(function (d) {
                return {
                    id: s + '-' + d,
                    x: s,
                    y: d,
                    z: randomizer(),
                    t: randomizer()
                };
            })
        };
    });
}

/**
 * Create some regular time points, along with
 * some overlay points
 */
function createOverlayPoints() {
    return createPoints('time', 3).concat(
        createPoints('timeSpan', 1, {numPoints: 3}).map(function (s) {
            s.key = 'overlays';
            return s;
        })
    );
}

/**
 * Randomize hour to assign hour out of 24
 */
function randomizeHour() {
    return Math.floor(Math.random() * 24);
}

/**
 * Randomize day to assign day out of 7
 */
function randomizeDay() {
    return Math.floor(Math.random() * 7);
}

/**
 * Randomize date backwards from current time
 */
function randomizeDateBack() {
    var date = new Date(new Date().getTime() -
        Math.floor(Math.random() * 100000000000));
    return date;
}

/**
 * Randomize date offseted from a passed in date
 */
function randomizeOffsetDate(inDate) {
    var date = new Date(inDate.getTime() -
        Math.floor(Math.random() * 10000000000));
    return date;
}

/**
 * Based on an index gives back a consistent date
 */
function dateByIndex(idx, step) {
    var s = step || 1000 * 60 * 60 * 24 * 7; // default one week
    return new Date(new Date(2013, 7, 1) - idx * s);
}

/**
 * Randomize count based off normal distribution
 */
function randomizeCount(opts) {
    var data = d3.random.normal(50, 8)();
    if (opts && opts.whole) {
        data = Math.round(data);
    }
    return data;
}

/**
 * Randomize percent decimal value based off normal distribution
 */
function randomizePercent() {
    return d3.random.normal(0, 0.5)();
}

/**
 * Randomize group variable to assign points
 */
function randomizeGroup(groups) {
    groups = groups || [0, 1, 2];

    return sonic.array.random(groups);
}

/**
 * Randomize symbol type
 */
function randomizeSymbolType() {
    return sonic.array.random([
        'circle', 'cross', 'diamond', 'square',
        'triangle-down', 'triangle-up'
    ]);
}

/**
 * Randomize symbol size
 */
function randomizeSymbolSize() {
    return sonic.randomInteger(50, 200);
}

/**
=======
/**
>>>>>>> master
 * Update the data in the DOM.
 */
function updateDataDisplay(data) {
    if(document && document.getElementById('data-display')) {
        document.getElementById('data-display').innerHTML = hljs.highlightAuto(JSON.stringify(data, undefined, 2)).value;
    }
}


function syntaxHighlight(json) {
    if (typeof json != 'string') {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'Number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'Key';
            } else {
                cls = 'String';
            }
        } else if (/true|false/.test(match)) {
            cls = 'Boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}


