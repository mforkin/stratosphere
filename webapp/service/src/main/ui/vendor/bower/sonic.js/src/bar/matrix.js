sonic.bar.matrix = function (viz, initialConfig) {
    var p = {
        xScale: null,
        yScale: null,
        zScale: null,
        config: {
            xDataKey: 'x',
            yDataKey: 'y',
            zDataKey: 'z',
            /**
             * Whether the z values are continuous and need to be quantized into the 
             * specified number of buckets (vs. the z-values are already bucketed 
             * as needed)
             */
            quantize: true,
            barPadding: 5,
            buckets: 5,
            fillOpacity: 0.6,
            colors: ['#FF0000', '#f46d43', '#f6faaa', '#abdda4', '#008000'],
            tooltip: {
                type: 'grouped' //todo implement single (1 per line)
            }
        }
    };

    function matrix(sel) {
        var groups;

        p.selection = sel;

        p.computeData();
        p.setScales();

        groups = sel.selectAll('.sonic-matrix.' + matrix.id())
            .data(p.data, function (d) {
                return d.key;
            });

        groups.enter().append('g')
            .classed('sonic-matrix ' + matrix.id(), true);

        groups.each(p.drawRects);

        groups.exit().remove();

        viz.registerVisibleContent(matrix, matrix.hasContent());
    }

    p.onVizMouseMove = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        p.updateTooltips(mouse, cps);

        //@todo: highlight hovered rects

        return cps;
    };

    p.closestPoints = function (mouse) {
        var x = mouse[0],
            y = mouse[1],
            point = null;

        p.data.forEach(function (d, i) {
            d.values.forEach(function (v) {
                var minX = Math.abs(p.xScale.position(v[p.config.xDataKey])),
                    maxX = Math.abs(p.xScale.position(v[p.config.xDataKey]) + p.getRectWidth()),
                    minY = Math.abs(p.yScale.position(v[p.config.yDataKey])),
                    maxY = Math.abs(p.yScale.position(v[p.config.yDataKey]) + p.getRectHeight());

                if (minX <= x && maxX >= x && minY <= y && maxY >= y) {
                    point = {
                        point: v,
                        key: d.key,
                        keyName: d.keyName
                    };
                }
            });
        });

        return point;
    };

    p.drawRects = function (d, sIndex) {
        var rects = d3.select(this).selectAll('rect')
            .data(function (d) {
                return d.values;
            });

        rects.enter().append('rect')
            .attr('fill-opacity', p.config.fillOpacity)
            .attr('x', function (d, i) {
                return p.xScale.position(d[p.config.xDataKey]) + p.config.barPadding;
            })
            .attr('y', function (d) {
                return p.yScale.position(d[p.config.yDataKey]);
            });

        rects.transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('stroke-width', p.config.strokeWidth)
            .attr('fill', function (d, i) {
                return p.config.colors[p.zScale(d[p.config.zDataKey])];
            })
            .attr('x', function (d, i) {
                return p.xScale.position(d[p.config.xDataKey]) + p.config.barPadding;
            })
            .attr('y', function (d) {
                return p.yScale.position(d[p.config.yDataKey]);
            })
            .attr('width', p.getRectWidth())
            .attr('height', p.getRectHeight());

        rects.exit().remove();
    };

    p.getRectWidth = function () {
        return p.xScale.rangeBand() - p.config.barPadding;
    };

    p.getRectHeight = function () {
        return p.yScale.rangeBand() - p.config.barPadding * 2;
    };

    p.setScales = function () {
        var zDomain;

        if (sonic.isSet(p.config.xScale)) {
            p.xScale = p.config.xScale;
            p.config.xScaleId = viz.register('scale', p.xScale);
            delete p.config.xScale;
        } else {
            if (p.config.xScaleId) {
                p.xScale = viz.findOne('scale', p.config.xScaleId);
            } else {
                p.xScale = viz.findOne('scale', { dataKey: p.config.xDataKey });
                p.config.xScaleId = p.xScale.id();
            }
        }

        if (sonic.isSet(p.config.yScale)) {
            p.yScale = p.config.yScale;
            p.config.yScaleId = viz.register('scale', p.yScale);
            delete p.config.yScale;
        } else {
            if (p.config.yScaleId) {
                p.yScale = viz.findOne('scale', p.config.yScaleId);
            } else {
                p.yScale = viz.findOne('scale', { dataKey: p.config.yDataKey });
                p.config.yScaleId = p.yScale.id();
            }
        }

        //quantize === false means that the z values already correspond to the bucket values
        //otherwise, the z value range is quantized
        if (p.config.quantize === false) {
            p.zScale = d3.scale.identity(d3.range(0, p.config.buckets));
        } else {
            zDomain = p.data.reduce(function (prev, curr) {
                return prev.concat(curr.values.map(function (d) {
                    return d[p.config.zDataKey];
                }));
            }, []);
            p.zScale = d3.scale.quantile().domain(zDomain).range(d3.range(0, p.config.buckets));
        }
    };

    p.computeData = function () {
        if (sonic.isSet(p.config.seriesKey)) {
            p.data = [viz.dataByKey(p.config.seriesKey)];
        } else if (sonic.isSet(p.config.seriesIndex)) {
            p.data = [viz.dataByIndex(p.config.seriesIndex)];
        } else {
            p.data = viz.data();
        }
    };

    p.updateTooltips = function (mouse, cps) {
        var renderFn = p.config.tooltip.renderFn || p.renderTooltips;

        if (p.config.tooltip) {
            if (mouse && cps) {
                p.config.tooltip.closestPoints = cps;
                p.config.tooltip.content = renderFn(cps, mouse);
                p.config.tooltip.associatedId = matrix.id();
                p.config.tooltip.mouse = mouse;

                viz.showTooltip(p.config.tooltip);
            } else {
                viz.hideTooltip(p.config.tooltip);
            }
        }
    };

    p.renderTooltips = function (cps, mouse) {
        return '<p><b>' + p.config.xDataKey + ': </b>' + cps.point[p.config.xDataKey] + '<br />' +
                '<b>' + p.config.yDataKey + ': </b>' + cps.point[p.config.yDataKey] + '<br />' +
                '<b>' + p.config.zDataKey + ': </b>' + cps.point[p.config.zDataKey] + '</p>';
    };

    sonic.augment(matrix, p, viz, 'registerable', 'listenable');
    matrix.mergeConfig(initialConfig);
    viz.register('sonic-matrix', matrix);

    return matrix;
};

function sonic_bar_matrix_add (v, c) {
    v.body().call(sonic.bar.matrix(v, c));
}

sonic_api.add('addMatrix', sonic_bar_matrix_add);
