sonic.network = function (viz, initialConfig) {
    var p = {
        network: d3.layout.force(),
        nodeToLinkMap: {},
        colorGradient: null,
        config: {
            type: 'sonic-network',
            cls: '',
            nodeIdKey: 'id',
            nodeDisplayKey: 'name',
            nodeGroupKey: 'group',
            nodeCircleRadiusKey: 'radius',
            nodeFillKey: 'fill',
            nodeImageKey: 'image',
            nodeImageHighlightKey: 'highlightImage',
            nodeImageWidthKey: 'width',
            nodeImageHeightKey: 'height',
            layoutOpts: {
                size: [viz.body().height() * 0.8, viz.body().width() * 0.8]
            },
            linkStyle: {
                opacity: 1,
                strokeWidth: 2,
                highlightStrokeWidthGrowth: 2,
                highlightStrokeColor: '#CCCCCC',
                stroke: '#CCCCCC',
                showDirections: true,
                gradient: null
            },
            //default node styling
            nodeStyle: {
                opacity: 0.7,
                strokeWidth: 2,
                colorBy: 'depth',
                nodeColors: sonic.colors.colorMap(),
                radius: 5,
                highlightRadiusGrowth: 3,
                label: {
                    fill: '#555',
                    fontFamiy: 'arial',
                    fontSize: '12px',
                    anchor: 'middle'
                },
                range: null
            },
            tooltip: {
                buffer: {
                    type: 'value',
                    amount: null
                }
            },
            networkForce: {
                gravity: 0.05,
                distance: 100,
                charge: -100
            }
        }
    };

    function network(sel, opts) {
        var classes = [p.config.cls, 'sonic-network'],
            groups;

        p.selection = sel;

        p.setupNetworkLayout();

        p.computeData(opts || {});

        groups = p.selection.selectAll('.sonic-network.' + network.id())
            .data([1]);

        groups.enter().append('g')
            .classed('sonic-network ' + network.id(), true);

        groups.each(p.drawNetwork);

        groups.exit().remove();

        viz.registerVisibleContent(network, network.hasContent());

    }

    network.hasContent = sonic.override(function () {
        return p.data.nodes && p.data.nodes.length > 0;
    });

    p.setupNetworkLayout = function () {
        var size = p.calcLayoutSize();
        p.network
            .size(size);
    };

    p.calcLayoutSize = function () {
        var size = p.config.layoutOpts.size;

        if (initialConfig && initialConfig.layoutOpts && initialConfig.layoutOpts.size) {
            size = initialConfig.layoutOpts.size;
        } else {
            size = p.calcLayoutLinear();
        }
        return size;
    };

    p.calcLayoutLinear = function () {
        return [p.calcHeight(), p.calcWidth()];
    };

    p.calcWidth = function () {
        return viz.body().width() * 0.8;
    };

    p.calcHeight = function () {
        return viz.body().height() * 0.8;
    };

    p.computeData = function (opts) {
        var i,
            j,
            data = viz.data()[0].values,
            linkMax = null,
            linkMin = null,
            curNodes = p.selection.selectAll('.node');

        p.colorGradient = null;
        p.nodeToLinkMap = {};

        p.data = {
            nodes: [],
            links: []
        };

        if (opts.remove) {
            return;
        }

        if (viz.data()[0] && viz.data()[0].values) {
            p.data.nodes = viz.data()[0].values;
        }

        if (viz.data()[1] && viz.data()[1].values) {
            p.data.links = viz.data()[1].values;
            p.data.links.forEach(function (link) {
                for (i = 0; i < p.data.nodes.length; i++) {
                    if (p.data.nodes[i][p.config.nodeIdKey] === link.source) {
                        link.source = p.data.nodes[i];
                    }
                }

                for (j = 0; j < p.data.nodes.length; j++) {
                    if (p.data.nodes[j][p.config.nodeIdKey] === link.target) {
                        link.target = p.data.nodes[j];
                    }
                }

                if (!p.nodeToLinkMap[link.source[p.config.nodeIdKey]]) {
                    p.nodeToLinkMap[link.source[p.config.nodeIdKey]] = [];
                }

                if (!p.nodeToLinkMap[link.target[p.config.nodeIdKey]]) {
                    p.nodeToLinkMap[link.target[p.config.nodeIdKey]] = [];
                }

                p.nodeToLinkMap[link.source[p.config.nodeIdKey]].push(link);
                p.nodeToLinkMap[link.target[p.config.nodeIdKey]].push(link);

                if (!sonic.isSet(linkMax) || link.weight > linkMax) {
                    linkMax = link.weight;
                }
                if (!sonic.isSet(linkMin) || link.weight < linkMin) {
                    linkMin = link.weight;
                }
            });
        }



        p.data.nodes.forEach(function (n) {
            n.links = p.nodeToLinkMap[n[p.config.nodeIdKey]];
            if (p.config.persistMove) {
                p.persistMove(n, curNodes);
            }
        });

        if (sonic.isSet(p.config.linkStyle.gradient)) {
            //if range spans pos and neg numbers
            if (linkMin * linkMax < 0) {
                //first half of gradient spans negative numbers, second half spans positive numbers
                //ie if values are ['red', 'black', 'green'] and link min is -1 and link max is 100 then red to black
                //maps values -1 to 0 and black to green maps 0 to 100
                p.colorGradient = sonic.colors.generateGradient(p.config.linkStyle.gradient, [linkMin, 0, linkMax]);
            } else {
                //color gradient ranges evenly over min and max
                p.colorGradient = sonic.colors.generateGradient(p.config.linkStyle.gradient, [linkMin, linkMax]);
            }
        }

        if (p.config.nodeStyle.range) {

            p.dataMin = d3.min(data, function (d) {
                return d[p.config.nodeCircleRadiusKey];
            });

            p.dataMax = d3.max(data, function (d) {
                return d[p.config.nodeCircleRadiusKey];
            });
        }
    };

    p.persistMove = function (node, currentNodes) {
        currentNodes.each(function (n) {
            if (node[p.config.nodeIdKey] === n[p.config.nodeIdKey] && n.moved === true) {
                node.x = node.pinX || n.x;
                node.y = node.pinY || n.y;
                node.moved = !node.pinX;
                node.fixed = !node.pinY;
            }
        });
    };

    p.drawNetwork = function () {
        var link,
            node;

        p.network
            .gravity(p.config.networkForce.gravity)
            .distance(p.config.networkForce.distance)
            .charge(p.config.networkForce.charge)
            .size([p.calcWidth(), p.calcHeight()])
            .nodes(p.data.nodes)
            .links(p.data.links)
            .start();

        link = p.addLinks.apply(this);
        node = p.addNodes.apply(this);

        p.network.on("tick", function() {
            node.attr("transform", function(d) {
                if (sonic.isSet(d.locationOffset) && !d.moved) {
                    d.x = viz.body().width() / 2 + (viz.body().width() / 2 * d.locationOffset.x);
                    d.y = viz.body().height() / 2 + (viz.body().height() / 2 * d.locationOffset.y);
                }

                if (sonic.isSet(d.pinX) && !d.moved) {
                    d.x = d.pinX;
                }

                if (sonic.isSet(d.pinY) && !d.moved) {
                    d.y = d.pinY;
                }

                if (d.x < 0) {
                    d.x = 0;
                } else if (d.x > viz.body().width()) {
                    d.x = viz.body().width();
                }

                if (d.y < 0) {
                    d.y = 0;
                } else if (d.y > viz.body().height()) {
                    d.y = viz.body().height();
                }

                return "translate(" + d.x + "," + d.y + ")";
            });

            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
        });
    };

    p.addLinks = function () {
        var link,
            newLink;

	// Using g group to assure links always appear below nodes and text
        d3.select(this).append("g").attr("id", "links");

        link = d3.select("#links").selectAll(".link")
            .data(p.network.links(), function (d) {
                return d.source[p.config.nodeIdKey] + '_' + d.target[p.config.nodeIdKey];
            });

        newLink = link.enter().append("line")
            .classed('link', true);

        link
            .style('stroke', function (d) {
                return sonic.isSet(p.colorGradient) ? p.colorGradient.getColor(d.weight).toString() : (d.stroke || d.color || p.config.linkStyle.stroke);
            })
            .style('stroke-width', function (d) {
                return p.config.linkStyle.strokeWidth;
            });

        link.exit().remove();
        return link;
    };

    p.addNodes = function () {
        var node,
            newNode,
            drag;

        drag = p.network.drag().on("dragstart", p.dragstart);

        node = d3.select(this).selectAll(".node")
            .data(p.data.nodes, function (d) {
                return parseInt(d[p.config.nodeIdKey], 10);
            });

        newNode = node.enter().append("g")
            .classed('node', true)
            .classed('fixed', function (d) {
                if (sonic.isSet(d.locationOffset) || (sonic.isSet(d.pinX) && sonic.isSet(d.pinY))) {
                    d.fixed = true;
                    return true;
                } else {
                    return false;
                }
            });

        node.call(drag);

        newNode.append("circle");

        node.selectAll('g circle')
            .attr('r', function (d) {
                var size = p.calcNodeSize(d);
                if (size.height && size.width) {
                    return 0;
                } else {
                    return size;
                }
            })
            .style('fill', function (d) {
                return p.getNodeColor.call(this, d);
            })
            .style('fill-opacity', p.config.nodeStyle.opacity)
            .style('stroke', function (d) {
                return d3.rgb(p.getNodeColor.call(this, d)).darker();
            })
            .style('stroke-width', p.config.nodeStyle.strokeWidth);

        newNode.append("image");

        node.selectAll('g image')
            .attr('xlink:href', function (d) {
                return p.getNodeImage.apply(this, arguments);
            })
            .attr("y", function (d) {
                var size = p.calcNodeSize(d);
                return size.height ? -1 * size.height / 2 : -10;
            })
            .attr("x", function (d) {
                var size = p.calcNodeSize(d);
                return size.width ? -1 * size.width / 2 : -10;
            })
            .attr("width", function (d) {
                var size = p.calcNodeSize(d);
                return size.width ? size.width : 16;
            })
            .attr("height", function (d) {
                var size = p.calcNodeSize(d);
                return size.height ? size.height : 16;
            });

        if (p.config.nodeStyle.label) {
            newNode.append("text");

            node.selectAll('g text')
                .attr('dx', function (d) {
                    return p.config.nodeStyle.label.dx || 0;
                })
                .attr("dy", function (d) {
                    if (p.config.nodeStyle.label.dy) {
                        return p.config.nodeStyle.label.dy;
                    } else {
                        var size = p.calcNodeSize(d);
                        if (size.height && size.width) {
                            return -1 * size.height / 2 - 5;
                        } else {
                            return -1 * size - 5;
                        }
                    }
                })
                .style('fill', p.config.nodeStyle.label.fill)
                .style('stroke', 'none')
                .style('font-size', p.config.nodeStyle.label.fontSize)
                .style('font-family', p.config.nodeStyle.label.fontFamily)
                .style('text-anchor', p.config.nodeStyle.label.anchor)
                .text(function(d) { return d[p.config.nodeDisplayKey]; });

        }

        node.exit().remove();
        return node;
    };

    p.dragstart = function (d) {
        d.fixed = true;
        d.moved = true;
        d3.select(this).classed("fixed", true);
    };

    p.dragstop = function (d) {
        d.dragging = false;
    };

    /**
     * Returns the size of the node. If it's a circle, returns the radius
     * otherwise returns the height and width of the node image.
     */
    p.calcNodeSize = function (d) {
        if (d && d[p.config.nodeImageKey] && sonic.isSet(d[p.config.nodeImageHeightKey]) &&
            sonic.isSet(d[p.config.nodeImageWidthKey])) {
            return {
                height: d[p.config.nodeImageHeightKey],
                width: d[p.config.nodeImageWidthKey]
            };
        } else if (d && sonic.isSet(d[p.config.nodeCircleRadiusKey])) {
            var range = p.config.nodeStyle.range,
                dataPercent;

            if (range) {
                dataPercent = (d[p.config.nodeCircleRadiusKey] - p.dataMin) / (p.dataMax - p.dataMin);
                return (range[1] - range[0]) * dataPercent + range[0];
            } else {
                return d[p.config.nodeCircleRadiusKey];
            }
        } else {
            return p.config.nodeStyle.radius;
        }
    };

    p.getNodeColor = function (d, i) {
        var color = d.color;
        if (!color) {
            if (p.config.nodeStyle.colorBy === 'depth') {
                color = p.config.nodeStyle.nodeColors(d.depth);
            } else {
                color = p.config.nodeStyle.nodeColors(d[p.config.nodeGroupKey]);
            }
        }

        if (sonic.svg.hasClass(this, 'selected')) {
            color = d3.rgb(color).darker().toString();
        }
        return color;
    };

    p.getNodeImage = function (d, i) {
        var image;

        if (d[p.config.nodeImageKey]) {
            image = d[p.config.nodeImageKey];
        }

        if (sonic.svg.hasClass(this, 'selected') && d[p.config.nodeImageHighlightKey]) {
            image = d[p.config.nodeImageHighlightKey];
        }
        return image;
    };

    p.closestPoints = function (mouse) {
        var nodeSize,
            cps = p.getClosestPoints(p.data, mouse);

        nodeSize = p.calcNodeSize(cps[0]);

        if (nodeSize.height && nodeSize.width) {
            if (cps[1] < Math.max(nodeSize.height, nodeSize.width)) {
                return cps;
            }
        } else {
            if (cps[1] < nodeSize) {
                return cps;
            }
        }
        return [];
    };

    p.isClosestPoint = function (d, cps) {
        var isClosest = false;

        if (cps) {
            cps.forEach(function (c) {
                if (c && c[p.config.nodeIdKey] === d[p.config.nodeIdKey]) {
                    isClosest = true;
                }
            });
        }

        return isClosest;
    };

    p.getClosestPoints = function (data, mouse) {
        var cps = [null, null];

        if (data.nodes) {
            data.nodes.forEach(function (d) {
                var dist = Math.sqrt(Math.pow(mouse[0] - d.x, 2) +
                    Math.pow(mouse[1] - d.y, 2));
                if (!cps[1] || dist < cps[1]) {
                    cps = [d, dist];
                }
            });
        }

        return cps;
    };

    /**
     * Handles clicking on a node.
     */
    p.onVizClick = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        p.selection.selectAll('.sonic-network.' + network.id() + ' g circle')
            .classed('selected', function (d, i) {
                return p.isClosestPoint(d, cps);
            })
            .style('fill', function (d) {
                return p.getNodeColor.apply(this, arguments);
            })
            .style('stroke', function (d) {
                return d3.rgb(p.getNodeColor.apply(this, arguments)).darker();
            });

        p.selection.selectAll('.sonic-network.' + network.id() + ' g image')
            .classed('selected', function (d, i) {
                return p.isClosestPoint(d, cps);
            })
            .attr('xlink:href', function (d) {
                return p.getNodeImage.apply(this, arguments);
            });

        return cps;
    };

    /**
     * Handles mousing over a node.
     */
    p.onVizMouseMove = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        p.updateTooltips(mouse, cps);
        p.selection.selectAll('.sonic-network.' + network.id() + ' g circle:not(.selected)')
            .style('fill', function (d) {
                var color = p.getNodeColor.apply(this, arguments);
                return p.isClosestPoint(d, cps) ? d3.rgb(color).brighter() : color;
            })
            .style('stroke', function (d) {
                var color = p.getNodeColor.apply(this, arguments);
                color = d3.rgb(color).darker();
                return p.isClosestPoint(d, cps) ? d3.rgb(color).brighter() : color;
            });

        p.selection.selectAll('.sonic-network.' + network.id() + ' g image:not(.selected)')
            .attr('xlink:href', function (d) {
                if (p.isClosestPoint(d, cps) && d[p.config.nodeImageHighlightKey]) {
                    return d[p.config.nodeImageHighlightKey];
                } else {
                    return p.getNodeImage.apply(this, arguments);
                }

            });

        p.selection.selectAll('.sonic-network.' + network.id() + ' line')
            .style('stroke-width', function (d) {
                var w = p.config.linkStyle.strokeWidth;
                return ((cps && cps.length > 0 && cps[0][p.config.nodeIdKey] === d.source[p.config.nodeIdKey] ||
                    (cps && cps.length > 0 && cps[0][p.config.nodeIdKey] === d.target[p.config.nodeIdKey])) ? w +
                    p.config.linkStyle.highlightStrokeWidthGrowth : w);
            })
            .style('stroke', function (d) {
                return ((cps && cps.length > 0 && cps[0][p.config.nodeIdKey] === d.source[p.config.nodeIdKey] ||
                    (cps && cps.length > 0 && cps[0][p.config.nodeIdKey] === d.target[p.config.nodeIdKey])) ?
                    p.config.linkStyle.highlightStrokeColor : (sonic.isSet(p.colorGradient) ? p.colorGradient.getColor(d.weight).toString() : (d.stroke || d.color || p.config.linkStyle.stroke)));
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
     * Render nodes and links by default
     */
    p.config.tooltip.renderFn = function (cps) {
        var content = '',
            nodeName;
        nodeName = cps[0].name;
        content = '<b>' + nodeName + '</b>';

        return content;
    };

    sonic.augment(network, p, viz, 'registerable', 'listenable');

    network.mergeConfig(initialConfig);

    viz.register('sonic-network', network);

    return network;
};

function sonic_network_add (v, c) {
    v.body().call(sonic.network(v, c));
}

function sonic_network_remove (v, c) {
    v.remove('sonic-network', c);
}

function sonic_network_update(v, p, c) {
    v.find('sonic-network', p).forEach(function (cmp) {
        cmp.mergeConfig(c);
        cmp.update();
    });
}

sonic_api.add('addNetwork', sonic_network_add);
sonic_api.add('updateNetwork', sonic_network_update);
sonic_api.add('removeNetwork', sonic_network_remove);
