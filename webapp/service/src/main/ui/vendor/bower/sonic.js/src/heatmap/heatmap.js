sonic.heatmap = function (viz, initialConfig) {
    var p = {
        xScale: null,
        yScale: null,
        config: {
            id: null,
            cls: '',
            x1DataKey: 'x',
            x2DataKey: 'x2',
            y1DataKey: 'y',
            y2DataKey: 'y2',
            zDataKey: 'z',
            xScaleId: null,
            yScaleId: null,
            colorGradient: {},
            colorConfig: {
                colorRange: {
                    defaultRange: ['#FFFFFF', '#F20C0C']
                },
                valueRange: {},
                step: null
            },
            seriesKeys: null,
            seriesIndexes: null,
            opacity: 1,
            interactive: true,
            tooltip: {
                renderFn: null
            },
            zoom: false
        }
    };

    function heatmap (sel, opts) {
        var classes = [p.config.cls, 'sonic-heatmap-set', heatmap.id()],
            groups;

        p.selection = sel;

        p.computeData(opts || {});
        p.setScales();
        p.computeColors();

        groups = sel.selectAll(classes.join('.'))
            .data(p.data, function (s) {
                return s.key;
            });

        groups
            .enter()
            .insert('g', ':first-child')
            .classed(classes.join(' '), true);

        groups.each(p.drawHeatmap);

        groups.exit().remove();

        if (p.config.zoom) {
            p.addZoom(opts);
        }

        viz.registerVisibleContent(heatmap, heatmap.hasContent());
    }

    p.addZoom = function (opts) {
        viz.addZoom(
            heatmap.id(),
            {
                zoom: {
                    opts: opts,
                    fn: p.zoomAction
                }
            },
            p.xScale,
            p.yScale
        );
    };

    p.zoomAction = function (opts) {
        //this might be inefficient with larger datasets. Maybe consider
        //translating and scaling directly rather than calling point.
        heatmap(p.selection, opts);
    };

    p.computeData = function (opts) {
        p.data = [];
        if (opts.remove) {
            return;
        }

        p.data = sonic.clone(viz.dataBySeries(p.config.seriesKeys, p.config.seriesIndexes));

        p.data.forEach(function (s, i) {
            s.index = i;
            s.values = s.values.filter(function (d) {
                if (p.xScale && p.yScale && p.config.zoom) {
                    if (d[p.config.x1DataKey] < p.xScale.domain()[0] && d[p.config.x2DataKey] > p.xScale.domain()[0]) {
                        d[p.config.x1DataKey] = p.xScale.domain()[0];
                    }
                    if (d[p.config.x1DataKey] < p.xScale.domain()[1] && d[p.config.x2DataKey] > p.xScale.domain()[1]) {
                        d[p.config.x2DataKey] = p.xScale.domain()[1];
                    }
                    if (d[p.config.y1DataKey] < p.yScale.domain()[0] && d[p.config.y2DataKey] > p.yScale.domain()[0]) {
                        d[p.config.y1DataKey] = p.yScale.domain()[0];
                    }
                    if (d[p.config.y1DataKey] < p.yScale.domain()[1] && d[p.config.y2DataKey] > p.yScale.domain()[1]) {
                        d[p.config.y2DataKey] = p.yScale.domain()[1];
                    }
                    return !(d[p.config.x1DataKey] < p.xScale.domain()[0] || d[p.config.x2DataKey] > p.xScale.domain()[1] || d[p.config.y1DataKey] < p.yScale.domain()[0] || d[p.config.y2DataKey] > p.yScale.domain()[1]);
                }
                return true;
            });
        });
    };

    p.setScales = function () {
        if (sonic.isSet(p.config.xScale)) {
            p.xScale = p.config.xScale;
            p.config.xScaleId = viz.register('scale', p.xScale);
            delete p.config.xScale;
        } else {
            if (p.config.xScaleId) {
                p.xScale = viz.findOne('scale', p.config.xScaleId);
            } else {
                p.xScale = viz.findOne('scale', { dataKey: p.config.x1DataKey });
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
                p.yScale = viz.findOne('scale', { dataKey: p.config.y1DataKey });
                p.config.yScaleId = p.yScale.id();
            }
        }
    };

    p.computeColors = function () {
        p.config.colorGradient = {};

        p.data.forEach(function (s) {
            var max = d3.max(s.values, function (d) { return d[p.config.zDataKey]; }),
                min = d3.min(s.values, function (d) { return d[p.config.zDataKey]; }),
                valueRange, colorRange;

            if (!p.config.colorConfig.colorRange[s.key]) {
                colorRange = p.config.colorConfig.colorRange.defaultRange;
            } else {
                colorRange = p.config.colorConfig.colorRange[s.key];
            }

            if (!p.config.colorConfig.valueRange[s.key]) {
                valueRange = d3.range(min, max + (max - min) / colorRange.length, (max - min) / (colorRange.length - 1));
            } else {
                valueRange = p.config.colorConfig.valueRange[s.key];
            }



            p.config.colorGradient[s.key] = sonic.colors.generateGradient(colorRange, valueRange, p.config.colorConfig.step);
        });
    };

    p.drawHeatmap = function (series, seriesIndex) {
        var dat = series.values,
            heatmap;

        heatmap = d3.select(this).selectAll('.sonic-heattile')
            .data(dat, function (d) {
                var xId, yId;
                if (d.bin) {
                    xId = d.bin;
                } else {
                    xId = d[p.config.x1DataKey] + '_' + d[p.config.x2DataKey];
                }
                if (d.bin2) {
                    yId = d.bin2;
                } else {
                    yId = d[p.config.y1DataKey] + '_' + d[p.config.y2DataKey];
                }
                return xId + '_' + yId;
            });

        heatmap.enter().append('rect')
            .classed('sonic-heattile', true)
            .style('stroke-width', 0)
            .attr('x', function (d) { return (p.xScale.position(d[p.config.x1DataKey]) + p.xScale.position(d[p.config.x2DataKey])) / 2; })
            .attr('y', function (d) { return (p.yScale.position(d[p.config.y2DataKey]) + p.yScale.position(d[p.config.y1DataKey])) / 2; })
            .attr('height', 0)
            .attr('width', 0);

        heatmap.transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('x', function (d) { return p.xScale.position(d[p.config.x1DataKey]); })
            .attr('y', function (d) { return p.yScale.position(d[p.config.y2DataKey]); })
            .attr('width', function (d) { return p.xScale.position(d[p.config.x2DataKey]) - p.xScale.position(d[p.config.x1DataKey]); })
            .attr('height', function (d) { return p.yScale.position(d[p.config.y1DataKey]) - p.yScale.position(d[p.config.y2DataKey]); })
            .attr('fill', function (d) { return d.color || p.config.colorGradient[series.key].getColor(d[p.config.zDataKey]).toString(); })
            .attr('fill-opacity', function (d) { return d.opacity || p.config.opacity; });

        heatmap.exit().remove();
    };

    p.onVizMouseMove = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        p.updateTooltips(mouse, cps);

        p.selection.selectAll('.sonic-heattile')
            .attr('fill', function (d, i) {
                var color;
                if(p.config.interactive && cps && cps.point === d){
                    color = p.config.colorGradient[cps.key].getColor(d[p.config.zDataKey]).brighter().toString();
                } else if (cps) {
                    color = p.config.colorGradient[cps.key].getColor(d[p.config.zDataKey]).toString();
                } else {
                    color = d3.select(this).attr('fill');
                }
                return color;
            });


        return cps;
    };

    p.closestPoints = function (mouse) {
        var x = mouse[0],
            y = mouse[1],
            point = null;

        p.data.forEach(function (d, i) {
            d.values.forEach(function (v) {
                var minX = Math.abs(p.xScale.position(v[p.config.x1DataKey])),
                    maxX = Math.abs(p.xScale.position(v[p.config.x2DataKey])),
                    minY = Math.abs(p.yScale.position(v[p.config.y2DataKey])),
                    maxY = Math.abs(p.yScale.position(v[p.config.y1DataKey]));

                if (minX <= x && maxX >= x && minY <= y && maxY >= y) {
                    point = {
                        point: v,
                        key: d.key
                    };
                }
            });
        });

        return point;
    };

    sonic.augment(heatmap, p, viz, 'registerable', 'listenable');

    heatmap.mergeConfig(initialConfig);

    viz.register('sonic-heatmap', heatmap);

    return heatmap;
};

function sonic_heatmap_add (v, c) {
    v.body().call(sonic.heatmap(v, c));
}

function sonic_heatmap_update (v, p, c) {
    v.find('sonic-heatmap', p).forEach(function (cmp) {
        cmp.mergeConfig(cmp);
        cmp.update();
    });
}

sonic_api.add('addHeat', sonic_heatmap_add);
sonic_api.add('updateHeat', sonic_heatmap_update);