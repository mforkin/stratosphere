sonic.tree = function (viz, initialConfig) {
    var p = {
        tree: d3.layout.tree(),
        config: {
            type: 'sonic-tree',
            cls: '',
            nodeIdKey: 'id',
            nodeDisplayKey: 'name',
            nodeGroupKey: 'group',
            nodeSizeKey: 'radius',
            nodeFillKey: 'fill',
            childrenKey: 'children',
            verticalTree: true,
            collapsible: false,
            layoutOpts: {
                size: [viz.body().height() * 0.8, viz.body().width() * 0.8],
                separation: function (a, b) {
                    return (a.parent === b.parent ? 1 : 2) / a.depth;
                },
                linkPathGenerator: d3.svg.diagonal()
                    .projection (function (d) {
                        if (p.config.verticalTree) {
                            return [d.x, d.y];
                        } else {
                            return [d.y, d.x];
                        }
                    })
            },
            linkStyle: {
                opacity: 1,
                strokeWidth: 2,
                highlightStrokeWidthGrowth: 2,
                stroke: '#CCCCCC',
                highlightStrokeChange: 'darker',
                showDirections: true
            },
            //default node styling
            nodeStyle: {
                opacity: 0.7,
                strokeWidth: 2,
                colorBy: 'depth',
                nodeColors: d3.scale.category20(),
                radius: 5,
                highlightRadiusGrowth: 3,
                highlightStrokeChange: 'brighter',
                highlightFillChange: 'brighter',
                collapsedFillColor: '#fff',
                labelNode: false,
                label: {
                    fill: '#555',
                    fontFamiy: 'arial',
                    fontSize: '12px',
                    anchor: 'middle'
                }
            },
            tooltip: {
                buffer: {
                    type: 'value',
                    amount: null
                }
            }
        }
    };

    function tree(sel, opts) {
        var classes = [p.config.cls, 'sonic-network'],
            groups;

        p.selection = sel;

        p.setupTreeLayout();

        p.computeData(opts || {});

        groups = p.selection.selectAll('.sonic-tree.' + tree.id())
            .data([1]);

        groups.enter().append('g')
            .classed('sonic-tree ' + tree.id(), true);

        groups.each(p.drawTree);

        groups.exit().remove();

    }

    p.setupTreeLayout = function () {
        var size = p.calcLayoutSize();
        p.tree
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
        return [viz.body().height() * 0.8, viz.body().width() * 0.8];
    };

    p.computeData = function (opts) {
        if (opts.remove) {
            p.data = {};
        }
        p.data = viz.data()[0].values[0];
    };

    p.drawTree = function () {
        var nodes,
            links;

        if (p.config.verticalTree) {
            nodes = p.tree.nodes(p.data);
        } else {
            nodes = p.tree.nodes(p.data).reverse();
        }

        links = p.tree.links(nodes);

        p.drawNode.call(this, nodes, p.data);
        p.drawLink.call(this, links, p.data);
    };

    p.drawLink = function (links, root) {
	// Declare the links
        var link = d3.select(this).selectAll("path.link")
            .data(links, function(d) { return d.target.id; });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr('d', function (d) {
                var o = {x: root.x0, y: root.y0};
                return p.config.layoutOpts.linkPathGenerator({source: o, target: o});
            })
            .style('stroke', function (d) {
                return d.color || p.config.linkStyle.stroke;
            })
            .style('stroke-width', function (d) {
                return p.config.linkStyle.strokeWidth;
            })
            .style('fill', 'none');

        // Transition links to their new position.
        link.transition()
            .duration(viz.animation().duration)
            .attr("d", p.config.layoutOpts.linkPathGenerator);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(viz.animation().duration)
            .attr('d', function (d) {
                var o = {x: root.x, y: root.y};
                return p.config.layoutOpts.linkPathGenerator({source: o, target: o});
            })
            .remove();
    };

    p.drawNode = function (nodes, root) {
        var node,
            nodeEnter,
            nodeUpdate,
            nodeExit;

        // Declare the nodes
        node = d3.select(this).selectAll("g.node")
            .data(nodes, function(d) {
                return d[p.config.nodeIdKey];
            });

        // Enter the nodes.
        nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) {
                if (p.config.verticalTree) {
                    return "translate(" + root.x0 + "," + root.y0 + ")";
                } else {
                    return "translate(" + root.y0 + "," + root.x0 + ")";
                }
            })
            .on("dblclick", p.onNodeDoubleClicked);

        nodeEnter.append("circle")
            .style('stroke', function (d) {
                return '#fff';
            })
            .style('stroke-width', p.config.nodeStyle.strokeWidth)
            .style('fill-opacity', p.config.nodeStyle.opacity)
            .attr("r", 1e-6);

        nodeEnter.append("text")
            .attr('dy', "4px")
            .attr('dx', function(d) {
                var radius = p.getNodeRadius(d);
                return (radius + 3) + 'px';
            })
            .attr("text-anchor", function(d) { return "start"; })
            .style("fill-opacity", 1e-6)
            .style('font', '4px sans-serif')
            .text(function (d) { return d[p.config.nodeDisplayKey] || ''; });

        // Transition nodes to their new position.
        nodeUpdate = node.transition()
            .duration(viz.animation().duration)
            .attr("transform", function(d) {
                if (p.config.verticalTree) {
                    return "translate(" + d.x + "," + d.y + ")";
                } else {
                    return "translate(" + d.y + "," + d.x + ")";
                }
            });

        nodeUpdate.select("circle")
            .attr('r', function (d) { return p.getNodeRadius(d); })
            .style('stroke', function (d) {
                var color = p.getNodeColor.apply(this, arguments);
                return d3.rgb(color).darker();
            })
            .style("fill", function(d) {
                var color = p.getNodeColor.apply(this, arguments);
                if (p.config.collapsible && d._children) {
                    color = p.config.nodeStyle.collapsedFillColor;
                }
                return color;
            });

        nodeUpdate.select("text")
            .style("fill-opacity", 1)
            .style('font', '10px sans-serif');

        // Transition exiting nodes to the parent's new position.
        nodeExit = node.exit().transition()
            .duration(viz.animation().duration)
            .attr("transform", function(d) {
                if (p.config.verticalTree) {
                    return "translate(" + root.x + "," + root.y + ")";
                } else {
                    return "translate(" + root.y + "," + root.x + ")";
                }
            })
            .remove();

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    };

    p.getNodeRadius = function (d) {
        var r;
        if (d[p.config.nodeSizeKey]) {
            r = d[p.config.nodeSizeKey];
        } else {
            r = p.config.nodeStyle.radius;
        }
        return r;
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

        if (mouse) {
            p.selection.selectAll('.sonic-tree.' + tree.id() + ' circle:not(.selected)')
                .style('fill', function (d) {
                    var color = p.getNodeColor.apply(this, arguments);
                    if (p.config.collapsible && d._children) {
                        color = p.config.nodeStyle.collapsedFillColor;
                    }
                    return p.isClosestPoint(d, cps) ? d3.rgb(color).brighter() : color;
                })
                .style('stroke', function (d) {
                    var color = p.getNodeColor.apply(this, arguments);
                    color = d3.rgb(color).darker();
                    return p.isClosestPoint(d, cps) ? d3.rgb(color).brighter() : color;
                })
                .attr('r', function (d) {
                    var radius = p.getNodeRadius(d);

                    return p.isClosestPoint(d, cps) ? radius +
                        p.config.nodeStyle.highlightRadiusGrowth : radius;
                });

            p.selection.selectAll('.sonic-tree.' + tree.id() + ' path')
                .style('stroke-width', function (d) {
                    var w = p.config.linkStyle.strokeWidth;
                    return ((cps.length > 0 && cps[0][p.config.nodeIdKey] === d.source[p.config.nodeIdKey] ||
                        (cps.length > 0 && cps[0][p.config.nodeIdKey] === d.target[p.config.nodeIdKey])) ? w +
                        p.config.linkStyle.highlightStrokeWidthGrowth :  w);
                });
        }

        return cps;
    };

    p.getNodeColor = function (d, i) {
        var color = d.color;
        if (!color) {
            if (p.config.nodeStyle.colorBy === 'depth') {
                color = p.config.nodeStyle.nodeColors(d.depth);
            } else {
                color = p.config.nodeStyle.nodeColors(d.group);
            }
        }

        if (sonic.svg.hasClass(this, 'selected')) {
            color = d3.rgb(color).darker().toString();
        }
        return color;
    };

    p.closestPoints = function (mouse) {
        var radius,
            cps = p.getClosestPoints(p.data, mouse);

        radius = p.getNodeRadius(cps[0]);

        if (cps[1] < radius) {
            return cps;
        }
        return [];
    };

    p.isClosestPoint = function (d, cps) {
        var isClosest = false;

        cps.forEach(function (c) {
            if (c && c[p.config.nodeIdKey] === d[p.config.nodeIdKey]) {
                isClosest = true;
            }
        });

        return isClosest;
    };

    p.getClosestPoints = function (d, mouse) {
        var dist, cps;

        if (p.config.verticalTree) {
            dist = Math.sqrt(Math.pow(mouse[0] - d.x, 2) + Math.pow(mouse[1] - d.y, 2));
        } else {
            dist = Math.sqrt(Math.pow(mouse[0] - d.y, 2) + Math.pow(mouse[1] - d.x, 2));
        }

        cps = [d, dist];
        if (d.children) {
            d.children.forEach(function (c) {
                var cDist = p.getClosestPoints(c, mouse);
                if (cDist[1] < cps[1]) {
                    cps = cDist;
                }
            });
        }

        return cps;
    };

    p.onNodeDoubleClicked = function (d) {
        if (p.config.collapsible && d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            viz.update();
        }
    };

    /**
     * Handles clicking on a node.
     */
    p.onVizClick = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        p.selection.selectAll('.sonic-tree.' + tree.id() + ' circle')
            .classed('selected', function (d, i) {
                return p.isClosestPoint(d, cps);
            })
            .style('fill', function (d) {
                var color = p.getNodeColor.apply(this, arguments);
                if (p.config.collapsible && d._children) {
                    color = p.config.nodeStyle.collapsedFillColor;
                }
                return color;
            })
            .style('stroke', function (d) {
                return d3.rgb(p.getNodeColor.apply(this, arguments)).darker();
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
                p.config.tooltip.associatedId = tree.id();
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
            nodeName,
            children;
        nodeName = cps[0].name;
        children = cps[0].children || [];
        content = '<p><b>' + nodeName + ':</b><br/>' +
            '<b>Children:</b><br/>';
        children.forEach(function (cp) {
            nodeName = cp.name;
            content = content +
                '<b>' + nodeName + '</b><br/>';
        });

        return content;
    };

    sonic.augment(tree, p, viz, 'registerable', 'listenable');

    tree.mergeConfig(initialConfig);

    viz.register('sonic-tree', tree);

    return tree;
};

function sonic_tree_add (v, c) {
    v.body().call(sonic.tree(v, c));
}

function sonic_tree_remove (v, c) {
    v.remove('sonic-tree', c);
}

function sonic_tree_update(v, p, c) {
    v.find('sonic-tree', p).forEach(function (cmp) {
        cmp.mergeConfig(c);
        cmp.update();
    });
}

sonic_api.add('addTree', sonic_tree_add);
sonic_api.add('updateTree', sonic_tree_update);
sonic_api.add('removeTree', sonic_tree_remove);
