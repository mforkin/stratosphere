sonic.hpie = function (viz, initialConfig) {
    var p = {
        config: {
            id: null,
            seriesKey: null,
            colors: sonic.colors.colorMap(),
            tooltip: {},
            colorByKey: 'group',
            labels: {
                show: true,
                threshold: Math.PI / 6,
                pointsPerPixel: 1 / 6
            }
        }
    };

    function hpie (sel, opts) {
        var classes = [p.config.cls, 'sonic-hpie'],
            groups;

        p.selection = sel;

        p.computeData(opts || {});

        groups = sel.selectAll('.sonic-hpie.' + hpie.id())
            .data(p.data, function (d) { return d.id || d.key + 'series'; });

        groups.enter().append('g')
            .classed('sonic-hpie ' + hpie.id(), true);

        groups
            .attr('transform', function (g) {
                return 'translate(' + (viz.body().width() / 2) + ',' + (viz.body().height() / 2) + ')';
            });

        groups.each(p.drawPie);

        if (p.config.labels.show) {
            groups.each(p.drawLabels);
        }

        //remove old slices
        groups.exit().remove();

        //since we just tried to draw a pie, we ask the viz to check its
        //content so it can appropriately update the no data message
        viz.registerVisibleContent(hpie, hpie.hasContent);
    }

    p.computeData = function (opts) {
        var partition = d3.layout.partition()
            .sort(null)
            .size([2 * Math.PI, Math.pow((Math.min(viz.body().width(), viz.body().height()) / 2), 2)])
            .value(function (d) { return d.size || 1; }),
            d;

        p.data = [];

        if (opts.remove) {
            return;
        }

        d = viz.dataBySeries(p.config.seriesKeys, null)
                .filter(function (d, i) {
                    if (d.values.length > 0) {
                        return true;
                    }
                });

        p.data = d.map(function (dp) {
            dp.values = partition.nodes(dp.values[0]);
            return dp;
        });

    };

    p.arcGenerator = function () {
        return d3.svg.arc()
            .startAngle(function(d) { return d.x; })
            .endAngle(function(d) { return d.x + d.dx; })
            .innerRadius(function(d) { return Math.sqrt(d.y); })
            .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });
    };

    p.arcTween = function (d) {
        var i = d3.interpolate({x: this._current.x, dx: this._current.dx}, d);
        this._current = i(0);

        return function (t) {
            return p.arcGenerator()(i(t));
        };
    };

    p.updateSlice = function (slice, index) {
        d3.select(this)
            .transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attrTween('d', p.arcTween);
    };

    p.drawPie = function (series, idx) {
        var groups = d3.select(this).selectAll('.pie-series')
            .data(series.values, function (d) { return d.name + '_' + d.id; });

        groups.enter().append('path')
            .classed('pie-series', true)
            .attr('id', function (d) { return d.id; })
            .attr('d', p.arcGenerator())
            .style('fill', function (d, i) {
                return d.color || p.config.colors(d[p.config.colorByKey] || d.name);
            })
            .attr('fill-opacity', 1)
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 1)
            .attr('stroke', function (d, i) {
                var dc = d.color || p.config.colors(d[p.config.colorByKey] || d.name);
                return d3.rgb(dc).darker().toString();
            })
            .each(function (d) { this._current = d; });

        groups.each(p.updateSlice);

        groups.exit().remove();
    };

    p.drawLabels = function (series, idx) {
        var groups = d3.select(this).selectAll('.sonic-hpie-labels')
            .data(series.values, function (d) { return d.name + '_' + d.id; });

        groups.enter().append('text')
            .classed('sonic-hpie-labels', true)
            .attr('dy', 20)
            .attr('dx', 10)
            .style('font-weight', 'bold')
                .append('textPath')
                    .classed('label-textpath', true)
                    .attr('xlink:href', function (d) { return '#' + d.id; });

        groups.selectAll('.label-textpath')
            .text(p.calcLabelText);

        /* this does pertendicular labels, should consider making this an configurable
        groups.transition()
             .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('transform', function (d) {
                var rotate = p.calcLabelRotation(d);
                var translate = p.calcLabelTranslate(d);
                return 'translate(' + translate + ')rotate(' + rotate + ')';
            })
            .text(p.calcLabelText);*/

        groups.exit().remove();
    };

    p.calcLabelText = function (d) {
        var r = (Math.sqrt(d.y + d.dy) - Math.sqrt(d.y)) / 2 + Math.sqrt(d.y),
            width = r * d.dx,
            maxLength = Math.floor(width * p.config.labels.pointsPerPixel);

        //@TODO make showing middle label configurable
        if (d.dx < p.config.labels.threshold || d.depth === 0) {
            return '';
        }

        if (d.name.length > maxLength) {
            return d.name.substring(0, Math.max(3, maxLength - 3)) + '...';
        } else {
            return d.name;
        }
    };

    p.calcLabelTranslate = function (d) {
        var translate = p.arcGenerator().centroid(d);
        if (d.x === 2 * Math.PI) {
            return 0;
        }
        return translate;
    };

    p.calcLabelRotation = function (d) {
        var rotate = 0,
            theta = d.x + d.dx / 2,
            q;
        if (d.dx === 2 * Math.PI) {
            return 0;
        }

        if (theta <= Math.PI / 2) {
            q = 1;
        } else if (theta <= Math.PI) {
            q = 4;
        } else if (theta <= 3 * Math.PI / 2) {
            q = 3;
        } else {
            q = 2;
        }

        switch (q) {
        case 1:
            rotate = -1 * (Math.PI / 2 - theta) * 180 / Math.PI;
            break;
        case 4:
            rotate = (theta - Math.PI / 2) * 180 / Math.PI;
            break;
        case 3:
            rotate = -1 * (3 * Math.PI / 2 - theta) * 180 / Math.PI;
            break;
        case 2:
            rotate = (theta - 3 * Math.PI / 2) * 180 / Math.PI;
            break;
        }

        return rotate;
    };

    hpie.highlightSlices = function (attr) {
        p.selection.selectAll('.pie-series').each(function (d) {
            var dc, pass = sonic.object.keys(attr).length > 0 ? true : false;
            sonic.each(attr, function (aKey, value) {
                if (!sonic.array.contains(value, d[aKey])) {
                    pass = false;
                }
            });
            if (pass) {
                d3.select(this).classed('sonic-hpie-selected', true);
            } else {
                d3.select(this).classed('sonic-hpie-selected', false);
            }
        });
    };

    /**
     * Default render tooltip function
     *
     *@todo create better default
     */
    p.renderTooltips = function (cps, mouse) {
        return cps.map(function (cp) {
            var html = '<p>';
            html = html + '<b>' + cp.name + ': </b>' +
                ((cp.dx) / (2 * Math.PI) * 100).toFixed(2) +
                '% (' + cp.value + ')<br />';
            return html + '</p>';
        }).join('');
    };

    p.onVizClick = function (mouse) {
        var cps = p.closestPoints(mouse);

        return cps;
    };

    /**
     * On viz mouse move, find closest points
     * and update tooltips accordingly.
     */
    p.onVizMouseMove = function (mouse) {
        var cps = p.closestPoints(mouse);

        p.updateTooltips(mouse, cps);

        p.selection.selectAll('.pie-series').each(function (d) {
            if (sonic.array.contains(cps, d)) {
                d3.select(this)
                    .classed('sonic-hpie-hover', true)
                    .attr('stroke', function (d) {
                        var dc = d.color || p.config.colors(d[p.config.colorByKey] || d.name);
                        return d3.rgb(dc).darker().darker().toString();
                    })
                    .style('fill', function (d, i) {
                        var df =  d.color || p.config.colors(d[p.config.colorByKey] || d.name);
                        return d3.rgb(df).brighter().toString();
                    });
            } else {
                d3.select(this)
                    .classed('sonic-hpie-hover', false)
                    .style('fill', function (d, i) {
                        return d.color || p.config.colors(d[p.config.colorByKey] || d.name);
                    })
                    .attr('stroke', function (d) {
                        var dc = d.color || p.config.colors(d[p.config.colorByKey] || d.name);
                        return d3.rgb(dc).darker().toString();
                    });
            }
        });

        return cps;
    };

    /**
     * Founds closest points to the mouse
     * @todo: rethink naming and maybe split this out
     */
    p.closestPoints = function (mouse) {
        var cps = [],
            m = mouse,
            dist,
            rad,
            vizPos = [viz.body().width() / 2, viz.body().height() / 2],
            mAng = -1,
            q;

        if (m) {
            dist = [m[0] - vizPos[0], m[1] - vizPos[1]];

            if (dist[0] < 0) {
                if (dist[1] < 0) {
                    q = 1;
                } else {
                    q = 4;
                }
            } else {
                if (dist[1] < 0) {
                    q = 2;
                } else {
                    q = 3;
                }
            }

            dist = dist.map(function (d) { return Math.abs(d); });

            switch (q) {

            case 1:
                mAng = 2 * Math.PI - Math.atan(dist[0] / dist[1]);
                break;
            case 2:
                mAng = Math.atan(dist[0] / dist[1]);
                break;
            case 3:
                mAng = Math.PI - Math.atan(dist[0] / dist[1]);
                break;
            case 4:
                mAng = Math.PI + Math.atan(dist[0] / dist[1]);
                break;
            }

            dist = sonic.geom.pythagorize(dist[0], dist[1]);
        }

        p.data.forEach(function (hgraph) {
            sonic.each(hgraph.values, function (key, pt) {
                if (p.isSliceSelected(mAng, dist, pt)) {
                    cps.push(pt);
                }
            });
        });

        return cps;
    };

    p.isSliceSelected = function (mAng, dist, pt) {
        if (mAng < pt.x || mAng > pt.x + pt.dx) {
            return false;
        }
        if (dist < Math.sqrt(pt.y) || dist > Math.sqrt(pt.y + pt.dy)) {
            return false;
        }
        return true;
    };

    sonic.augment(hpie, p, viz, 'registerable', 'listenable');

    hpie.mergeConfig(initialConfig);

    viz.register('sonic-hpie', hpie);

    return hpie;
};

function sonic_hpie_add (v, c) {
    v.body().call(sonic.hpie(v, c));
}

function sonic_hpie_highlightSlices (v, p, c) {
    v.find('sonic-hpie', p).forEach(function (cmp) {
        cmp.highlightSlices(c);
    });
}

sonic_api.add('addHPie', sonic_hpie_add);
sonic_api.add('highlightSlices', sonic_hpie_highlightSlices);