/**
 * Creates a network graph component using the d3 force directed layout
 */
sonic.network = function (viz, initialConfig) {
    //our private variables, p is an alias
    var p = {
        force: d3.layout.force(), //force directed layout
        linkColorGradient: null, //the calculated color gradient for links
        linkWeightRange: [null, null], //the range of link weights
        linkStrokeFn: null, //fn to determine a links stroke
        nodeLinkCountWeightMap: { //stores counts and total weights per node based on links
            countRange: [null, null], //gives count range for all nodes
            weightRange: [null, null] //give weight range for all nodes
        },
        config: {
            type: 'network',
            cls: '',
            //our default data keys
            nodeIdKey: 'id',
            nodeDisplayKey: 'name',
            nodeGroupKey: 'group',
            nodeSizeKey: 'radius',
            nodeFillKey: 'fill',
            linkSourceKey: 'source',
            linkTargetKey: 'target',
            linkWeightKey: 'weight',
            linkStrokeKey: 'stroke',
            linkStrokeWidthKey: 'strokeWidth',
            //default link styling
            linkStyle: {
                opacity: 1,
                strokeWidth: {
                    range: [1, 5]
                },
                highlightStrokeWidthGrowth: 2,
                stroke: '#CCCCCC',
                highlightStrokeChange: 'darker',
                showDirections: true
            },
            //default node styling
            nodeStyle: {
                opacity: 0.7,
                strokeWidth: 2,
                nodeColors: sonic.colors.colorMap(),
                radius: 5,
                highlightRadiusGrowth: 3,
                highlightStrokeChange: 'brighter',
                highlightFillChange: 'brighter',
                labelNode: false,
                label: {
                    fill: '#555',
                    fontFamiy: 'arial',
                    fontSize: '12px',
                    anchor: 'middle'
                }
            },
            //default tooltip options
            tooltip: {
                buffer: {
                    type: 'value',
                    amount: null
                }
            },
            //default networkEnv for the force directed layout
            networkEnv: {
                charge: -240,
                linkDistance: null,
                simulationSteps: {
                    max: 1000,
                    min: 100
                }
            }
        }
    };

    function network(sel, opts) {
        var classes = [p.config.cls, 'network'],
            groups;

        //set our selection
        p.selection = sel;

        //compute our data
        p.computeData(opts || {});

        //compute the color gradient
        p.computeColorGradient();

        //setup markers
        p.setupMarkers();

        //setup the network node environment
        p.setupNetworkEnv();

        //setup a network group
        groups = p.selection.selectAll('.network.' + network.id())
            .data([1]);

        groups.enter().append('g')
            .classed('network ' + network.id(), true);

        //draw nodes in initial position
        groups.each(p.drawNodes);

        //draw links in initial position
        groups.each(p.drawLinks);

        //remove exited groups(which never removes anything since we hard code to 1)
        groups.exit().remove();

        //run the network layout to position the nodes
        p.runNetworkLayout();

        //redraw network pieces to show a smooth transition to new position
        groups.each(p.drawNodes);
        groups.each(p.drawLinks);

        viz.registerVisibleContent(network, network.hasContent());
    }

    network.hasContent = sonic.override(function () {
        return p.data.nodes.length > 0;
    });

    /**
     * Initializes computed variables
     */
    p.initCalculatedVariables = function () {
        p.linkColorGradient = null;
        p.linkWeightRange = [null, null];
        p.linkStrokeFn = null;
        p.nodeLinkCountWeightMap = {
            countRange: [null, null],
            weightRange: [null, null]
        };
    };

    /**
     * Transforms our passed in data
     */
    p.computeData = function (opts) {
        var nodes = [],
            links = [],
            idIndexMap = [],
            nodeInfo;

        //reset calculated vars
        p.initCalculatedVariables();

        //initialize to empty data
        p.data = {
            nodes: nodes,
            links: links
        };

        //if we are removing we leave data empty
        if (opts.remove) {
            return;
        }

        nodes = viz.data().filter(function (d) {
            //gets the node data
            return d.key === 0 || d.key === 'nodes';
        })[0].values.map(function (d, i) {
            //keeps track of node indexes
            idIndexMap[d[p.config.nodeIdKey]] = i;
            //return a node data piece
            nodeInfo = {
                id: d[p.config.nodeIdKey],
                name: d[p.config.nodeDisplayKey],
                group: d[p.config.nodeGroupKey],
                pinX: (sonic.isSet(d.locationOffset) ? (viz.body().width() / 2 + (viz.body().width() / 2 * d.locationOffset.x)) : d.pinX),
                pinY: (sonic.isSet(d.locationOffset) ? (viz.body().height() / 2 - (viz.body().height() / 2 * d.locationOffset.y)) : d.pinY)
            };

            nodeInfo = sonic.object.merge(d, nodeInfo);

            return nodeInfo;
        });

        links = viz.data().filter(function (d) {
            //get the link data
            return d.key === 1 || d.key === 'links';
        })[0].values.map(function (d) {
            var sourceNode = d[p.config.linkSourceKey],
                targetNode = d[p.config.linkTargetKey],
                linkWeight = d[p.config.linkWeightKey];

            //updates the link weight range, useful for rendering links
            p.reCalcLinkWeightRange(linkWeight);
            //updates the each nodes link count and total weight sum
            p.reCalcLinkCountMap(sourceNode, linkWeight);
            p.reCalcLinkCountMap(targetNode, linkWeight);

            //returns a link data piece
            return {
                source: idIndexMap[sourceNode],
                target: idIndexMap[targetNode],
                value: linkWeight,
                stroke: d[p.config.linkStrokeKey],
                toSource: p.config.linkStyle.showDirections && d['to' + sonic.capFirstLetter(p.config.linkSourceKey)],
                toTarget: p.config.linkStyle.showDirections && d['to' + sonic.capFirstLetter(p.config.linkTargetKey)]
            };
        });

        //sets our data
        p.data.nodes = nodes;
        p.data.links = links;

        //if the link weight range is 0 set it to one for rendering
        if (p.linkWeightRange[0] === p.linkWeightRange[1]) {
            p.linkWeightRange[1] = p.linkWeightRange[1] + 1;
        }

        //create a fn to render the link strokes based on the calculated link weights
        //and passed config
        p.createLinkStrokeFn();

        //
        p.calcCountWeightRange();
    };

    p.calcCountWeightRange = function () {
        //first get the link and weight range across all data
        sonic.each(p.nodeLinkCountWeightMap, function (k, d) {
            if (!sonic.isSet(p.nodeLinkCountWeightMap.countRange[0]) || d.count < p.nodeLinkCountWeightMap.countRange[0]) {
                p.nodeLinkCountWeightMap.countRange[0] = d.count;
            }

            if (!sonic.isSet(p.nodeLinkCountWeightMap.countRange[1]) || d.count > p.nodeLinkCountWeightMap.countRange[1]) {
                p.nodeLinkCountWeightMap.countRange[1] = d.count;
            }

            if (!sonic.isSet(p.nodeLinkCountWeightMap.weightRange[0]) || d.totalWeight < p.nodeLinkCountWeightMap.weightRange[0]) {
                p.nodeLinkCountWeightMap.weightRange[0] = d.totalWeight;
            }

            if (!sonic.isSet(p.nodeLinkCountWeightMap.weightRange[1]) || d.totalWeight > p.nodeLinkCountWeightMap.weightRange[1]) {
                p.nodeLinkCountWeightMap.weightRange[1] = d.totalWeight;
            }
        });

        //based on ranges create a linear interpolation fn to get a node radius
        //from the node id (which maps to the link or weight count)
        if (sonic.isObject(p.config.nodeStyle.radius)) {
            var wm, wb, wfn, cm, cb, cfn,
                rrange = p.config.nodeStyle.radius.range,
                wrange = p.nodeLinkCountWeightMap.weightRange,
                crange = p.nodeLinkCountWeightMap.countRange;

            wm = (rrange[1] - rrange[0]) / (wrange[1] - wrange[0]);
            cm = (rrange[1] - rrange[0]) / (crange[1] - crange[0]);
            wb = rrange[1] - wm * wrange[1];
            cb = rrange[1] - cm * crange[1];

            p.nodeLinkCountWeightMap.weightFn = function (d) {
                if (!sonic.isSet(p.nodeLinkCountWeightMap[d[p.config.nodeIdKey]])) {
                    return rrange[0];
                }
                return wm * p.nodeLinkCountWeightMap[d[p.config.nodeIdKey]].totalWeight + wb;
            };

            p.nodeLinkCountWeightMap.countFn = function (d) {
                if (!sonic.isSet(p.nodeLinkCountWeightMap[d[p.config.nodeIdKey]])) {
                    return rrange[0];
                }
                return cm * p.nodeLinkCountWeightMap[d[p.config.nodeIdKey]].count + cb;
            };
        }
    };

    /**
     * Updates the link count and total weight sum of a node based on current conditions
     */
    p.reCalcLinkCountMap = function (node, linkWeight) {
        if (p.nodeLinkCountWeightMap[node]) {
            p.nodeLinkCountWeightMap[node].count = p.nodeLinkCountWeightMap[node].count + 1;
            p.nodeLinkCountWeightMap[node].totalWeight = p.nodeLinkCountWeightMap[node].totalWeight + linkWeight;
        } else {
            p.nodeLinkCountWeightMap[node] = {
                count: 1,
                totalWeight: linkWeight
            };
        }
    };

    /**
     * Uses a linear interpolation to calculate the link stroke width based on
     * the link weights
     */
    p.createLinkStrokeFn = function () {
        var m, b, fn;

        if (sonic.isObject(p.config.linkStyle.strokeWidth)) {
            m = (p.config.linkStyle.strokeWidth.range[1] - p.config.linkStyle.strokeWidth.range[0]) / (p.linkWeightRange[1] - p.linkWeightRange[0]);
            b = p.config.linkStyle.strokeWidth.range[0] - m * p.linkWeightRange[0];
            fn = function (d) { return m * d.value + b; };
        } else {
            fn = function () { return p.config.strokeWidth; };
        }
        p.linkStrokeFn = function (d) {
            return fn(d);
        };
    };

    /**
     * updates the min max weight range based on the weight
     */
    p.reCalcLinkWeightRange = function (weight) {
        if (!sonic.isSet(p.linkWeightRange[0]) || weight < p.linkWeightRange[0]) {
            p.linkWeightRange[0] = weight;
        }

        if (!sonic.isSet(p.linkWeightRange[1]) || weight > p.linkWeightRange[1]) {
            p.linkWeightRange[1] = weight;
        }
    };

    /**
     * Generates a color gradient based on the link weight range
     */
    p.computeColorGradient = function () {
        p.linkColorGradient = sonic.isObject(p.config.linkStyle.stroke) ?
            sonic.colors.generateGradient(
                p.config.linkStyle.stroke.range,
                p.linkWeightRange
            ) : null;
    };

    p.setupMarkers = function () {
        // define arrow markers for graph links
        p.selection.selectAll('.endArrow').data([1]).enter().append('svg:defs').append('svg:marker')
            .attr('id', 'end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 6)
            .attr('markerWidth', 3)
            .attr('markerHeight', 3)
            .attr('orient', 'auto')
            .classed('endArrow', true)
          .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#000')
            .style('stroke-width', '4px');

        p.selection.selectAll('.startArrow').data([1]).enter().append('svg:defs').append('svg:marker')
            .attr('id', 'start-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 4)
            .attr('markerWidth', 3)
            .attr('markerHeight', 3)
            .attr('orient', 'auto')
            .classed('startArrow', true)
          .append('svg:path')
            .attr('d', 'M10,-5L0,0L10,5')
            .attr('fill', '#000')
            .style('stroke-width', '4px');
    };

    /**
     * Sets up the network environment
     */
    p.setupNetworkEnv = function () {
        var dataLength = p.data.nodes.length;
        //sets the link distance based on the number of nodes
        //with fewer nodes we can spread the nodes out a bit
        //with more nodes we have to squish them together a bit
        //@TODO factor in viz body height and width
        if (!initialConfig.networkEnv || !sonic.isSet(initialConfig.networkEnv.linkDistance)) {
            p.config.networkEnv.linkDistance = (400 - dataLength * 5) / dataLength;
        }
        //calculates gravity based on number of nodes, the more nodes we have
        //the stronger gravity is necessary to keep nodes from escaping the viz
        //note we manually prevent nodes from escaping the viz, but they will
        //bunch at the corners if gravity too small
        if (!initialConfig.networkEnv || !sonic.isSet(initialConfig.networkEnv.gravity)) {
            p.config.networkEnv.gravity = 0.01 * dataLength - 0.05;
        }

        //sets the force variables
        p.force
            .size([viz.body().width(), viz.body().height()])
            .nodes(p.data.nodes)
            .links(p.data.links)
            .linkDistance(p.config.networkEnv.linkDistance)
            //.gravity(p.config.networkEnv.gravity)
            .charge(p.config.networkEnv.charge)
            .on('tick', p.runSimulationStep);

        //initializes the network layout
        p.config.networkEnv.initializeLayout();

        p.force.start();
    };

    /**
     * Deterministically places the nodes by positioning related nodes
     * near each other
     */
    p.config.networkEnv.initializeLayout = function () {
        p.force.nodes().forEach(function (n, i) {
            n.x = viz.body().width() / 2;
            n.y = viz.body().height() / 2;
        });
    };

    /**
     * Given an id returns the node
     */
    p.getNode = function (id) {
        return p.force.nodes().filter(function (d) {
            return id === d[p.config.nodeIdKey];
        })[0];
    };

    /**
     * Runs one step of the simulation
     */
    p.runSimulationStep = function () {
        //set nodes with pinned positions
        p.data.nodes.forEach(function (n) {
            if (n.pinX) {
                n.x = n.pinX;
            }
            if (n.pinY) {
                n.y = n.pinY;
            }
        });

        p.data.links.forEach(function (l) {
            if (l.source.pinX) {
                l.source.x = l.source.pinX;
            }
            if (l.source.pinY) {
                l.source.y = l.source.pinY;
            }
            if (l.target.pinX) {
                l.target.x = l.target.pinX;
            }
            if (l.target.pinY) {
                l.target.y = l.target.pinY;
            }

        });
    };

    /**
     * Runs the network layout based on min max config and number of nodes
     * in network
     */
    p.runNetworkLayout = function () {
        var simSteps = Math.min(
                p.config.networkEnv.simulationSteps.min,
                Math.max(
                    p.data.nodes.length,
                    p.config.networkEnv.simulationSteps.max
                )
            );
        d3.range(simSteps).forEach(function () {
            p.force.tick();
        });

        p.force.stop();
    };

    /**
     * Draws the links
     * @TODO maybe use translate rather than x1,y1,etc to improve efficiency
     * and not do so much repetitive calculation. Also think about how best to
     * draw arrows
     */
    p.drawLinks = function () {
        var links = d3.select(this).selectAll('line.link')
            .data(p.force.links()),
            directions = d3.select(this).selectAll('line.dir')
            .data(p.force.links());

        directions.enter().insert('line', ':first-child')
            .classed('dir', true);

        links.enter().insert('line', ":first-child")
            .classed('link', true);


        links.transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('x1', function (d) {
                var deltaX = d.target.x - d.source.x,
                    deltaY = d.target.y - d.source.y,
                    dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
                    norm = deltaX / dist,
                    r = p.calcNodeSize(d.source),
                    padding = d.toSource ? 5 + r : r;
                if (dist === 0) {
                    return 0;
                }
                return (d.source.pinX || d.source.x) + (padding * norm);
            })
            .attr('y1', function (d) {
                var deltaX = d.target.x - d.source.x,
                    deltaY = d.target.y - d.source.y,
                    dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
                    norm = deltaY / dist,
                    r = p.calcNodeSize(d.source),
                    padding = d.toSource ? 5 + r : r;
                if (dist === 0) {
                    return 0;
                }
                return (d.source.pinY || d.source.y) + (padding * norm);
            })
            .attr('x2', function (d) {
                var deltaX = d.target.x - d.source.x,
                    deltaY = d.target.y - d.source.y,
                    dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
                    norm = deltaX / dist,
                    r = p.calcNodeSize(d.target),
                    padding = d.toTarget ? 5 + r : r;
                if (dist === 0) {
                    return 0;
                }
                return (d.target.pinX || d.target.x) - (padding * norm);
            })
            .attr('y2', function (d) {
                var deltaX = d.target.x - d.source.x,
                    deltaY = d.target.y - d.source.y,
                    dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
                    norm = deltaY / dist,
                    r = p.calcNodeSize(d.target),
                    padding = d.toTarget ? 5 + r : r;
                if (dist === 0) {
                    return 0;
                }
                return (d.target.pinY || d.target.y) - (padding * norm);
            })
            .style('stroke', function (d) {
                if (sonic.isSet(d[p.config.linkStrokeKey])) {
                    return d[p.config.linkStrokeKey];
                }
                if (sonic.isObject(p.config.linkStyle.stroke)) {
                    return p.linkColorGradient.getColor(d.value);
                }
                return p.config.linkStyle.stroke;
            })
            .style('stroke-width', function (d) {
                if (sonic.isSet(d[p.config.strokeWidthKey])) {
                    return d[p.config.strokeWidthKey];
                }
                if (sonic.isObject(p.config.linkStyle.strokeWidth)) {
                    return p.linkStrokeFn(d);
                }
                return p.config.linkStyle.strokeWidth;
            });

        links.exit().remove();

        directions.transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('x1', function (d) {
                var deltaX = d.target.x - d.source.x,
                    deltaY = d.target.y - d.source.y,
                    dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
                    norm = deltaX / dist,
                    r = p.calcNodeSize(d.source),
                    padding = d.toSource ? 5 + r : r;
                if (dist === 0) {
                    return 0;
                }
                return (d.source.pinX || d.source.x) + (padding * norm);
            })
            .attr('y1', function (d) {
                var deltaX = d.target.x - d.source.x,
                    deltaY = d.target.y - d.source.y,
                    dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
                    norm = deltaY / dist,
                    r = p.calcNodeSize(d.source),
                    padding = d.toSource ? 5 + r : r;
                if (dist === 0) {
                    return 0;
                }
                return (d.source.pinY || d.source.y) + (padding * norm);
            })
            .attr('x2', function (d) {
                var deltaX = d.target.x - d.source.x,
                    deltaY = d.target.y - d.source.y,
                    dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
                    norm = deltaX / dist,
                    r = p.calcNodeSize(d.target),
                    padding = d.toTarget ? 5 + r : r;
                if (dist === 0) {
                    return 0;
                }
                return (d.target.pinX || d.target.x) - (padding * norm);
            })
            .attr('y2', function (d) {
                var deltaX = d.target.x - d.source.x,
                    deltaY = d.target.y - d.source.y,
                    dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
                    norm = deltaY / dist,
                    r = p.calcNodeSize(d.target),
                    padding = d.toTarget ? 5 + r : r;
                if (dist === 0) {
                    return 0;
                }
                return (d.target.pinY || d.target.y) - (padding * norm);
            })
            .style('marker-start', function (d) { return d.toSource ? 'url(#start-arrow)' : ''; })
            .style('marker-end', function (d) { return d.toTarget ? 'url(#end-arrow)' : ''; })
            .style('stroke-width', '3px');

        p.selection.selectAll('.endArrow').selectAll('path')
            .attr('fill', function (d) {
                if (sonic.isSet(d[p.config.linkStrokeKey])) {
                    return d[p.config.linkStrokeKey];
                }
                if (sonic.isObject(p.config.linkStyle.stroke)) {
                    return p.linkColorGradient.getColor(d.value);
                }
                return p.config.linkStyle.stroke;
            });
        p.selection.selectAll('.startArrow').selectAll('path')
            .attr('fill', function (d) {
                if (sonic.isSet(d[p.config.linkStrokeKey])) {
                    return d[p.config.linkStrokeKey];
                }
                if (sonic.isObject(p.config.linkStyle.stroke)) {
                    return p.linkColorGradient.getColor(d.value);
                }
                return p.config.linkStyle.stroke;
            });

        directions.exit().remove();
    };

    /**
     * Draws the nodes
     * @TODO maybe use translate rather than cx,cy to reduce repetitive calculations
     */
    p.drawNodes = function () {
        var nodes = d3.select(this).selectAll('circle.node')
                .data(
                    p.force.nodes(),
                    function (d) {
                        return d[p.config.nodeIdKey];
                    }
                );

        nodes
            .enter()
            .append('circle')
            .classed('node', true);

        nodes
            .transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('r', p.calcNodeSize)
            .attr('cx', function (d) {
                var r = p.calcNodeSize(d);
                d.x = Math.max(r, Math.min(viz.body().width() - r, d.x));
                return d.pinX || d.x;
            })
            .attr('cy', function (d) {
                var r = p.calcNodeSize(d);
                d.y = Math.max(r, Math.min(viz.body().height() - r, d.y));
                return d.pinY || d.y;
            })
            .style('fill', function (d) {
                return p.config.nodeStyle.nodeColors(d[p.config.nodeGroupKey]);
            })
            .style('fill-opacity', p.config.nodeStyle.opacity)
            .style('stroke', function (d) {
                return d3.rgb(p.config.nodeStyle.nodeColors(d[p.config.nodeGroupKey])).darker();
            })
            .style('stroke-width', p.config.nodeStyle.strokeWidth);

        nodes.exit().remove();

        if (p.config.nodeStyle.labelNodes) {
            p.labelNodes.call(this);
        }
    };

    /**
     * Labels the nodes
     * @todo attach to container g with circles to only calc x and y once
     */
    p.labelNodes = function () {
        var labels = d3.select(this).selectAll('text.node')
            .data(p.force.nodes(), function (d) { return d[p.config.nodeIdKey]; });

        labels.enter()
            .append('text')
            .classed('node', true);

        labels.transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('x', function (d) {
                return d.pinX || d.x;
            })
            .attr('y', function (d) {
                return d.pinY || d.y;
            })
            .attr('dy', function (d) {
                return p.config.nodeStyle.label.dy || (-1 * p.calcNodeSize(d) - 5);
            })
            .attr('dx', function (d) {
                return p.config.nodeStyle.label.dx || 0;
            })
            .style('fill', p.config.nodeStyle.label.fill)
            .style('font-size', p.config.nodeStyle.label.fontSize)
            .style('font-family', p.config.nodeStyle.label.fontFamily)
            .style('text-anchor', p.config.nodeStyle.label.anchor)
            .text(function (d) {
                return d[p.config.nodeDisplayKey];
            });
    };

    /**
     * Returns the radius of a node based on config and data
     */
    p.calcNodeSize = function (d) {
        if (sonic.isSet(d[p.config.nodeSizeKey])) {
            return d[p.config.nodeSizeKey];
        }
        if (sonic.isObject(p.config.nodeStyle.radius)) {
            if (p.config.nodeStyle.radius.type === 'weightBased') {
                return p.nodeLinkCountWeightMap.weightFn(d);
            }
            if (p.config.nodeStyle.radius.type === 'countBased') {
                return p.nodeLinkCountWeightMap.countFn(d);
            }
        }
        return p.config.nodeStyle.radius;

    };

    /**
     * On mouse move update the hovered node and relevant links style
     */
    p.onVizMouseMove = function (mouse){
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        p.updateTooltips(mouse, cps);

        p.selection.selectAll('.network.' + network.id() + ' circle.node')
            .style('fill', function (d) {
                var fill = p.config.nodeStyle.nodeColors(d[p.config.nodeGroupKey]);
                return (p.isClosestPoint(cps, d)) ? d3.rgb(fill)[p.config.nodeStyle.highlightFillChange]().toString() : fill;
            })
            .style('stroke', function (d) {
                var stroke = d3.rgb(p.config.nodeStyle.nodeColors(d[p.config.nodeGroupKey])).darker();
                return (p.isClosestPoint(cps, d)) ? d3.rgb(stroke)[p.config.nodeStyle.highlightStrokeChange]().toString() : stroke;
            })
            .attr('r', function (d) {
                var r = p.calcNodeSize(d);
                return p.isClosestPoint(cps, d) ? r + p.config.nodeStyle.highlightRadiusGrowth : r;
            });

        p.selection.selectAll('.network.' + network.id() + ' line.link')
            .style('stroke', function (d) {
                var s;
                if (sonic.isSet(d[p.config.linkStrokeKey])) {
                    s = d[p.config.linkStrokeKey];
                } else if (sonic.isObject(p.config.linkStyle.stroke)) {
                    s = p.linkColorGradient.getColor(d.value);
                } else {
                    s = p.config.linkStyle.stroke;
                }

                return p.isClosestPoint(cps, d[p.config.linkSourceKey]) || p.isClosestPoint(cps, d[p.config.linkTargetKey]) ? d3.rgb(s)[p.config.linkStyle.highlightStrokeChange]().toString() : s;
            })
            .style('stroke-width', function (d) {
                var w;
                if (sonic.isSet(d[p.config.strokeWidthKey])) {
                    w = d[p.config.strokeWidthKey];
                } else if (sonic.isObject(p.config.linkStyle.strokeWidth)) {
                    w = p.linkStrokeFn(d);
                } else {
                    w = p.config.linkStyle.strokeWidth;
                }
                return p.isClosestPoint(cps, d[p.config.linkSourceKey]) || p.isClosestPoint(cps, d[p.config.linkTargetKey]) ? w + p.config.linkStyle.highlightStrokeWidthGrowth : w;
            });

        return cps;
    };

    /**
     * Update tooltips
     */
    p.updateTooltips = function (mouse, cps) {
        var renderFn = p.config.tooltip.renderFn || p.renderTooltips;

        if (p.config.tooltip) {
            if (mouse && cps.length > 0) {
                p.config.tooltip.closestPoints = cps;
                p.config.tooltip.content = renderFn(cps, mouse);
                p.config.tooltip.associatedId = network.id();
                p.config.tooltip.mouse = mouse;

                viz.showTooltip(p.config.tooltip);
            } else {
                viz.hideTooltip(p.config.tooltip);
            }
        }
    };

    /**
     * Determine if a node is the closest point to the mouse
     */
    p.isClosestPoint = function (cps, d) {
        return cps && cps.length > 0 && cps[0].node[p.config.nodeIdKey] === d[p.config.nodeIdKey];
    };

    /**
     * @TODO implement
     */
    p.onVizClick = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        return cps;
    };

    /**
     * Calculates the closest points based on if the mouse is inside the node
     * radius
     */
    p.closestPoints = function (mouse) {
        var pt = {},
            cps = [];
        p.data.nodes.forEach(function (n) {
            if (Math.sqrt(Math.pow(mouse[0] - n.x, 2) + Math.pow(mouse[1] - n.y, 2)) <= p.calcNodeSize(n) + (p.config.tooltip.buffer.amount || 0)) {
                pt.node = n;
            }
        });
        if (pt.node) {
            pt.links = p.data.links.filter(function (l) {
                return (pt.node[p.config.nodeIdKey] === l.source[p.config.nodeIdKey] || pt.node[p.config.nodeIdKey] === l.target[p.config.nodeIdKey]);
            });
            cps.push(pt);
        }
        return cps;
    };

    /**
     * Render nodes and links by default
     */
    p.renderTooltips = function (cps) {
        var content = '',
            nodeName,
            nodeId;

        cps.forEach(function (cp) {
            nodeName = cp.node[p.config.nodeDisplayKey];
            nodeId = cp.node[p.config.nodeIdKey];
            content = content +
                '<p><b>' + nodeName + ':</b><br/>' +
                '<b>Links:</b><br/>';

            cp.links.forEach(function (l) {
                content = content +
                (l.source[p.config.nodeIdKey] === nodeId ?
                    l.target[p.config.nodeDisplayKey] : l.source[p.config.nodeDisplayKey]) +
                    ' : ' + l.value + '<br/>';
            });

            content = content + '</p>';
        });

        return content;
    };

    /**
     * Make the network registerable and listenable
     */
    sonic.augment(network, p, viz, 'registerable', 'listenable');

    /**
     * Merge configuration
     */
    network.mergeConfig(initialConfig);

    /**
     * Register network with viz
     */
    viz.register('network', network);

    return network;

};

function sonic_network_add (v, c) {
    v.body().call(sonic.network(v, c));
}

function sonic_network_remove (v, c) {
    v.remove('network', c);
}

function sonic_network_update(v, p, c) {
    v.find('network', p).forEach(function (cmp) {
        cmp.mergeConfig(c);
        cmp.update();
    });
}

sonic_api.add('addNetwork', sonic_network_add);
sonic_api.add('updateNetwork', sonic_network_update);
sonic_api.add('removeNetwork', sonic_network_remove);