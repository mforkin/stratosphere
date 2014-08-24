sonic.line.difference = function (viz, initialConfig) {
    var p = {
        xScale: null,
        yScale: null,
        config: {
            id: null,
            xDataKey: 'x',
            yDataKey: 'y',
            base: {
                key: null,
                index: null
            },
            compare: {
                key: null,
                index: null
            },
            interpolator: 'linear',
            buffer: 0, //allow clipping by points within this distance
            decreaseColor: 'blue',
            increaseColor: 'red',
            fillOpacity: 0.75
        }
    };

    function difference(sel, opts) {
        var groups,
            entered;

        opts = opts || {};
        p.selection = sel;

        p.setScales();
        p.computeData(opts);

        groups = sel.selectAll('.sonic-difference.' + difference.id())
            .data(p.data)
            .attr('opacity', 0);

        entered = groups.enter().append('g')
            .classed('sonic-difference ' + difference.id(), true);

        entered.append('svg').append('clipPath')
            .attr('id', 'clip-below-' + difference.id())
            .classed('clip-path clip-below', true)
            .append('path');

        entered.append('svg').append('clipPath')
            .attr('id', 'clip-above-' + difference.id(), true)
            .classed('clip-path clip-above', true)
            .append('path');

        entered.append('path')
            .classed('clip-below', true)
            .attr('fill', p.config.decreaseColor)
            .attr('fill-opacity', p.config.fillOpacity)
            .attr('clip-path', 'url(#clip-below-' + difference.id() + ')');

        entered.append('path')
            .classed('clip-above', true)
            .attr('fill', p.config.increaseColor)
            .attr('fill-opacity', p.config.fillOpacity)
            .attr('clip-path', 'url(#clip-above-' + difference.id() + ')');

        groups.each(p.updateDifferences);

        groups.exit()
            .attr('opacity', p.config.fillOpacity)
            .transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('opacity', 0)
            .remove();

        viz.registerVisibleContent(difference, difference.hasContent());
    }

    p.computeData = function (opts) {
        var base,
            compare;

        p.data = [];

        base = viz.dataBySeries(p.config.base.key, p.config.base.index);
        compare = viz.dataBySeries(p.config.compare.key, p.config.compare.index);

        if (opts.remove || base.length === 0 || compare.length === 0) {
            return;
        }

        p.data.push({
            key: 'single',
            baseValues: p.xScale.sort(base[0].values),
            compareValues: p.xScale.sort(compare[0].values)
        });
    };

    p.areaGenerator = function () {
        return d3.svg.area()
            .interpolate(p.config.interpolator)
            .x(function (d) {
                return p.xScale.position(d[p.config.xDataKey]);
            })
            .y1(function (d) {
                return p.yScale.position(d[p.config.yDataKey]);
            });
    };

    p.setScales = function () {
        if (p.config.xScaleId) {
            p.xScale = viz.findOne('scale', p.config.xScaleId);
        } else {
            p.xScale = viz.findOne('scale', { dataKey: p.config.xDataKey });
            p.config.xScaleId = p.xScale.id();
        }

        if (p.config.yScaleId) {
            p.yScale = viz.findOne('scale', p.config.yScaleId);
        } else {
            p.yScale = viz.findOne('scale', { dataKey: p.config.yDataKey });
            p.config.yScaleId = p.yScale.id();
        }
    };

    p.updateDifferences = function (series, index) {
        var group = d3.select(this),
            areaGen = p.areaGenerator(),
            groupData = group.data()[0];

        areaGen.y0(viz.body().height());

        group.select('.clip-path.clip-below path')
            .transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('d', function (d) {
                return areaGen(d.baseValues);
            });

        areaGen.y0(0);

        group.select('.clip-path.clip-above path')
            .transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('d', function (d) {
                return areaGen(d.baseValues);
            });

        areaGen.y0(function (d, i) {
            var nearest,
                val;

            nearest = p.xScale.nearest(
                d,
                groupData.compareValues
            );

            if (nearest.dist <= p.config.buffer) {
                val = nearest.point[p.config.yDataKey];
            } else {
                val = d[p.config.yDataKey];
            }

            return p.yScale.position(val);
        });

        group.select('path.clip-above')
            .transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('d', function (d) {
                return areaGen(d.baseValues);
            });

        group.select('path.clip-below')
            .transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('d', function (d) {
                return areaGen(d.baseValues);
            });

        group.transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('opacity', p.config.fillOpacity);
    };

    sonic.augment(difference, p, viz, 'registerable', 'listenable');
    difference.mergeConfig(initialConfig);
    viz.register('sonic-difference', difference);

    return difference;
};

function sonic_line_difference_add (v, c) {
    v.body().call(sonic.line.difference(v, c));
}

function sonic_line_difference_remove (v, p) {
    v.remove('sonic-difference', p);
}

sonic_api.add('addDifference', sonic_line_difference_add);
sonic_api.add('removeDifference', sonic_line_difference_remove);
