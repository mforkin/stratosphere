sonic.boxAndWhisker = function (viz, initialConfig) {
    var p = {
        xScale: null,
        yScale: null,
        config: {
            id: null,
            cls: '',
            xScaleId: null,
            yScaleId: null,
            seriesKeys: null,
            seriesIndexes: null,
            valueKey: 'value',
            currentPoint: {
                val: null
            },
            boxStyle: {
                fill: '#FA8E46',
                stroke: '#FA8E46',
                strokeWidth: 2,
                fillOpacity: 0.6
            },
            whiskerStyle: {
                stroke: '#FA8E46',
                strokeWidth: 1
            },
            medianStyle: {
                stroke: '#E00707',
                strokeWidth: 2
            },
            currentPointStyle: {
                fill: '#3DDDF2',
                fillOpacity: 0.8,
                stroke: '#3DDDF2',
                strokeWidth: 2,
                type: 'diamond',
                size: 50
            },
            sortFn: function (a, b) {
                if (a < b) {
                    return -1;
                } else if (b < a) {
                    return 1;
                }
                return 0;
            },
            tooltip: {
                type: 'global',
                renderFn: function (cps, mouse) {
                    return '<p><b>Min Outlier: </b>' + cps[0].min + '<br/>' +
                        '<b>1st Quartile: </b>' + cps[0].q1 + '<br/>' +
                        '<b>Median: </b>' + cps[0].q2 + '<br/>' +
                        '<b>3rd Quartile: </b>' + cps[0].q3 + '<br/>' +
                        '<b>Max Outlier: </b>' + cps[0].max + '<br/>' +
                        '<b>Current Point: </b>' + p.config.currentPoint.val + '<br/></p>';
                }
            }
        }
    };

    function boxAndWhisker (sel, opts) {
        var classes = [p.config.cls, 'line'],
            groups;

        p.selection = sel;

        p.computeData(opts || {});

        p.setScales();

        groups = sel.selectAll('.sonic-box-and-whisker.' + boxAndWhisker.id())
            .data([p.data]);

        groups.enter().append('g')
            .classed('sonic-box-and-whisker ' + boxAndWhisker.id(), true);

        groups.each(p.drawBox);
        groups.each(p.drawMedian);
        groups.each(p.drawWhiskers);
        groups.each(p.drawCurrentPoint);

        groups.exit().remove();
    }

    p.computeData = function (opts) {
        var d = [],
            q1,
            q2,
            q3,
            min,
            max;

        p.data = [];

        if (opts.remove) {
            return;
        }

        viz
            .dataBySeries(p.config.seriesKeys, p.config.seriesIndexes)
            .filter(function (d, i) {
                if (d.values.length > 0) {
                    return true;
                }
            }).forEach(function (data) {
                d = d.concat(data.values);
            });

        d = d.map(function (dp) {
            if (sonic.isSet(dp[p.config.valueKey])) {
                return dp[p.config.valueKey];
            } else {
                return dp;
            }
        });

        d.sort(p.config.sortFn);

        p.computeQuartilesAndExtrema(d);
    };

    p.computeQuartilesAndExtrema = function (d) {
        var left, right;

        p.data = {
            min: null,
            max: null,
            q1: null,
            q2: null,
            q3: null
        };

        p.data.min = d[0];
        p.data.max = d[d.length - 1];

        if (d.length % 2 === 0) {
            p.data.q2 = (d[d.length / 2] + d[(d.length / 2) - 1]) / 2;
            left = d.slice(0, d.length / 2);
            right = d.slice(d.length / 2, d.length);
        } else {
            p.data.q2 = d[Math.floor(d.length / 2)];
            left = d.slice(0, Math.floor(d.length / 2));
            right = d.slice(Math.ceil(d.length / 2), d.length);
        }

        if (left % 2 === 0) {
            p.data.q1 = (left[left.length / 2] + left[(left.length / 2) - 1]) / 2;
        } else {
            p.data.q1 = left[Math.floor(left.length / 2)];
        }

        if (right % 2 === 0) {
            p.data.q3 = (right[right.length / 2] + right[(right.length / 2) - 1]) / 2;
        } else {
            p.data.q3 = right[Math.floor(right.length / 2)];
        }
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
    };

    p.drawBox = function () {
        var box = d3.select(this).selectAll('rect')
            .data([p.data]);

        box.enter().append('rect');

        box.transition()
            .duration(viz.animation().duration)
            .delay(viz.animation().delay)
            .style('stroke-width', p.config.boxStyle.strokeWidth)
            .style('stroke', p.config.boxStyle.stroke)
            .style('fill', p.config.boxStyle.fill)
            .style('fill-opacity', p.config.boxStyle.fillOpacity)
            .attr('x', p.xScale.position(p.data.q1))
            .attr('y', p.yScale.position(1))
            .attr('height', p.yScale.position(0) - p.yScale.position(1))
            .attr('width', p.xScale.position(p.data.q3) - p.xScale.position(p.data.q1));

        box.exit().remove();

    };

    p.drawMedian = function () {
        var median = d3.select(this).selectAll('line.median')
            .data([p.data]);

        median.enter().append('line')
            .classed('median', true);

        median
            .transition()
            .duration(viz.animation().duration)
            .delay(viz.animation().delay)
            .style('stroke', p.config.medianStyle.stroke)
            .style('stroke-width', p.config.medianStyle.strokeWidth)
            .attr('x1', p.xScale.position(p.data.q2))
            .attr('y1', p.yScale.position(0))
            .attr('x2', p.xScale.position(p.data.q2))
            .attr('y2', p.yScale.position(1));

        median.exit().remove();

    };

    p.drawWhiskers = function () {
        var whiskers = d3.select(this).selectAll('g.whiskers')
            .data([p.data]),
            left,
            right;

        whiskers.enter().append('g')
            .classed('whiskers', true);

        left = whiskers.selectAll('line.left-whisker')
            .data([p.data]);

        left.enter().append('line')
            .classed('left-whisker', true);

        right = whiskers.selectAll('line.right-whisker')
            .data([p.data]);

        right.enter().append('line')
            .classed('right-whisker', true);

        left
            .transition()
            .duration(viz.animation().duration)
            .delay(viz.animation().delay)
            .style('stroke', p.config.whiskerStyle.stroke)
            .style('stroke-width', p.config.whiskerStyle.strokeWidth)
            .attr('x1', p.xScale.position(p.data.min))
            .attr('y1', p.yScale.position(0.5))
            .attr('x2', p.xScale.position(p.data.q1))
            .attr('y2', p.yScale.position(0.5));

        right
            .transition()
            .duration(viz.animation().duration)
            .delay(viz.animation().delay)
            .style('stroke', p.config.whiskerStyle.stroke)
            .style('stroke-width', p.config.whiskerStyle.strokeWidth)
            .attr('x1', p.xScale.position(p.data.q3))
            .attr('y1', p.yScale.position(0.5))
            .attr('x2', p.xScale.position(p.data.max))
            .attr('y2', p.yScale.position(0.5));

        left.exit().remove();
        right.exit().remove();
        whiskers.exit().remove();
    };

    p.symbolGenerator = function (cps) {
        return d3.svg.symbol()
            .type(function (d) {
                return d.type || p.config.currentPointStyle.type;
            })
            .size(function (d) {
                var size = d.size || p.config.currentPointStyle.size;
                return size;
            });
    };

    p.drawCurrentPoint = function () {
        var cp = d3.select(this).selectAll('path.currentPoint')
            .data([p.config.currentPointStyle]);

        cp.enter().append('path')
            .classed('currentPoint', true)
            .attr('d', 'M0,0');
        cp
            .transition()
            .duration(viz.animation().duration)
            .delay(viz.animation().delay)
            .attr('transform', 'translate(' + p.xScale.position(p.config.currentPoint.val) + ',' + p.yScale.position(0.5) + ')')
            .attr('stroke', p.config.currentPointStyle.stroke)
            .attr('stroke-width', p.config.currentPointStyle.strokeWidth)
            .attr('fill', p.config.currentPointStyle.fill)
            .attr('fill-opacity', p.config.currentPointStyle.fillOpacity)
            .attr('d', p.symbolGenerator());

        cp.exit().remove();

    };

    p.onVizMouseMove = function (mouse) {
        p.updateTooltips(mouse, [p.data]);
    };

    sonic.augment(boxAndWhisker, p, viz, 'registerable', 'listenable');

    boxAndWhisker.mergeConfig(initialConfig);

    viz.register('sonic-box-and-whisker', boxAndWhisker);

    return boxAndWhisker;
};

function sonic_boxAndWhisker_add (v, c) {
    v.body().call(sonic.boxAndWhisker(v, c));
}

function sonic_boxAndWhisker_update (v, p, c) {
    v.find('sonic-box-and-whisker', p).forEach(function (cmp) {
        cmp.mergeConfig(c);
        cmp.update();
    });
}

function sonic_boxAndWhisker_remove (v, c) {
    v.remove('sonic-box-and-whisker', c);
}

sonic_api.add('addBoxAndWhisker', sonic_boxAndWhisker_add);
sonic_api.add('updateBoxAndWhisker', sonic_boxAndWhisker_update);
sonic_api.add('removeBoxAndWhisker', sonic_boxAndWhisker_remove);