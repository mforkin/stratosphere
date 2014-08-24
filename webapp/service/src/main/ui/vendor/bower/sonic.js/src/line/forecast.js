sonic.line.forecast = function (viz, initialConfig) {
    var p = {
        xScale: null,
        yScale: null,
        config: {
            xDataKey: 'x',
            yDataKey: 'y',
            strokeWidth: 3,
            stroke: 'yellow',
            fanColor: 'lightblue',
            seriesKeys: null,
            seriesIndexes: null,
            fromSeriesKey: null,
            fromSeriesIndex: null,
            tooltip: {
                buffer: {
                    type: 'value', //or pixel
                    amount: null
                },
                renderFn: null
            }
        }
    };

    function forecast(sel) {
        var groups,
            enter;

        p.selection = sel;

        p.computeData();
        p.setScales();

        groups = sel.selectAll('.sonic-forecast.' + forecast.id())
            .data(p.data, function (d) {
                return d.key;
            });

        enter = groups.enter().append('g')
            .classed('sonic-forecast ' + forecast.id(), true);

        groups.each(p.drawForecast);

        groups.exit().remove();

        viz.registerVisibleContent(forecast, forecast.hasContent());
    }

    p.drawForecast = function (series, index) {
        var el = this;

        p.drawFan.call(el, series, index);
        p.drawLine.call(el, series, index);
    };

    p.drawFan = function (series, index) {
        var areas,
            confidences;

        if (series.values.length > 0 && sonic.isSet(series.values[series.values.length - 1].confidences)) {
            confidences = series.values[series.values.length - 1].confidences.sort(sonic.sortByProp('id'));
        } else {
            confidences = [];
        }

        areas = d3.select(this).selectAll('g.sonic-forecast.' + forecast.id() + ' path.area')
            .data(confidences, function (d) {
                return d.id;
            });

        areas.enter().insert('path', ":first-child")
            .classed('area', true)
            .attr('fill', function (d, i) {
                return d3.rgb(p.config.fanColor).darker(i + 1);
            });

        areas.transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('d', function (d, i) {
                return p.areaGenerator(d.id)(series.values);
            });

        areas.exit().remove();
    };

    p.drawLine = function (series, index) {
        var lines,
            lData;

        if (series.values.length === 0) {
            lData = [];
        } else {
            lData = [1];
        }

        lines = d3.select(this).selectAll('g.sonic-forecast.' + forecast.id() + ' path.line')
            .data(lData);

        lines.enter().append('path')
            .classed('line', true)
            .attr('stroke-width', p.config.strokeWidth)
            .attr('stroke', function (d, i) {
                return p.getLineColor.call(this, d, i, series);
            })
            .attr('fill-opacity', 0);

        lines
            .data(series.values).transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('d', function (d) {
                var vals = series.values;
                if (p.config.sort) {
                    vals = p.xScale.sort(vals);
                }
                return p.lineGenerator()(vals);
            });

        lines.exit().remove();
    };

    p.getLineColor = function (d, i, series) {
        return series.color || p.config.stroke;
    };

    p.lineGenerator = function () {
        return d3.svg.line()
            .x(function (d) {
                return p.xScale.position(d[p.config.xDataKey]);
            })
            .y(function (d) {
                return p.yScale.position(d[p.config.yDataKey]);
            });
    };

    p.areaGenerator = function (confidenceId) {
        var confidence = function (d) {
            return d.confidences.filter(function (c) {
                return c.id === confidenceId ? true : false;
            }).pop();
        };

        return d3.svg.area()
            .x(function (d) {
                return p.xScale.position(d[p.config.xDataKey]);
            })
            .y0(function (d) {
                if (!d.confidences) {
                    return p.yScale.position(d[p.config.yDataKey]);
                } else {
                    return p.yScale.position(confidence(d).low);
                }
            })
            .y1(function (d) {
                if (!d.confidences) {
                    return p.yScale.position(d[p.config.yDataKey]);
                } else {
                    return p.yScale.position(confidence(d).high);
                }
            });
    };

    p.computeData = function () {
        p.data = [];

        viz.data().forEach(function (s, i) {
            if (sonic.isSet(p.config.seriesKeys) &&
                    p.config.seriesKeys.indexOf(s.key) !== -1) {
                p.data.push(s);
            } else if (sonic.isSet(p.config.seriesIndexes) &&
                    p.config.seriesIndexes.indexOf(i) !== -1) {
                p.data.push(s);
            } else if (!sonic.isSet(p.config.seriesKeys) &&
                    !sonic.isSet(p.config.seriesIndexes)) {
                p.data.push(s);
            }
        });

        if (p.isValidDataSet()) {
            p.addLastActualValue();
        }
    };

    /**
     * Make sure that all series have 
     * Todo can relax this constraint at some point (and
     * just ignore bad series), but for now, is a pain 
     * to do so
     */
    p.isValidDataSet = function () {
        return p.data.every(function (d) {
            return sonic.isSet(d) && sonic.isArray(d.values);
        });
    };

    /**
     * Add last value from the series that this one 
     * is predicting from
     *
     * @todo this needs to be generalized a bit
     * @todo probably need to sort the other series
     * @make sure this works if forecasting in historical
     * context (i.e. would have overlapping sales and forecast
     * data)
     */
    p.addLastActualValue = function () {
        var actualSeries,
            point;

        if (p.config.fromSeriesKey) {
            actualSeries = viz.dataByKey(p.config.fromSeriesKey);
        } else if (p.config.fromSeriesIndex) {
            actualSeries = viz.dataByKey(p.config.fromSeriesKey);
        }

        if (actualSeries) {
            p.data.forEach(function (d) {
                if (d.values.length > 0) {
                    point = sonic.clone(
                        actualSeries.values[actualSeries.values.length - 1]
                    );
                    point.nonForecast = true;
                    d.values.unshift(point);
                }
            });
        }
    };

    p.setScales = function () {
        var yScaleMin,
            yScaleMax,
            baseLine,
            yAxis;

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

        yScaleMin = p.computeMinY();
        yScaleMax = p.computeMaxY();

        //@todo more general solution here
        if (yScaleMin < p.yScale.domainMin() || yScaleMax > p.yScale.domainMax()) {
            p.yScale.domain([yScaleMin, yScaleMax], true);

            viz.refreshRegistry(forecast.id());
        }
    };

    p.computeMinY = function () {
        return d3.min(p.data, function (s) {
            return d3.min(s.values, function (d) {
                if (d.confidences) {
                    return d3.min(d.confidences, function (c) {
                        return c.low;
                    });
                } else {
                    return d[p.config.yDataKey];
                }
            });
        });
    };

    p.computeMaxY = function () {
        return d3.max(p.data, function (s) {
            return d3.max(s.values, function (d) {
                if (d.confidences) {
                    return d3.max(d.confidences, function (c) {
                        return c.high;
                    });
                } else {
                    return d[p.config.yDataKey];
                }
            });
        });
    };

    p.onVizMouseMove = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        p.updateTooltips(mouse, cps);

        return cps;
    };

    p.closestPoints = function (mouse) {
        var cps,
            x = mouse[0],
            y = mouse[1];

        cps = p.data.map(function (d) {
            return {
                key: d.key,
                dist: null,
                point: null
            };
        });

        p.data.forEach(function (d, i) {
            d.values.forEach(function (v) {
                var dist;

                if (v.nonForecast) {
                    return;
                }

                dist = Math.abs(p.xScale.position(v[p.config.xDataKey]) - x);

                if (!cps[i].point || dist < cps[i].dist) {
                    if (p.pointWithinBuffer(v, dist)) {
                        cps[i].point = v;
                        cps[i].dist = dist;
                    }
                }
            });
        });

        cps = cps.filter(function (d) {
            return (sonic.isSet(d.point)) ? true : false;
        });

        return cps;
    };

    p.updateTooltips = function (mouse, cps) {
        var content,
            renderFn = p.config.tooltip.renderFn || p.renderTooltips;

        if (p.config.tooltip) {
            if (mouse && cps.length > 0) {
                p.config.tooltip.closestPoints = cps;
                p.config.tooltip.content = renderFn(cps, mouse);
                p.config.tooltip.associatedId = forecast.id();
                p.config.tooltip.mouse = mouse;

                viz.showTooltip(p.config.tooltip);
            } else {
                viz.hideTooltip(p.config.tooltip);
            }
        }
    };

    p.renderTooltips = function (cps, mouse) {
        return cps.map(function (cp) {
            var html = '<p>';
            if (cps.length > 1  || (p.config.tooltip && p.config.tooltip.type === 'global')) {
                html = html + '<b><u>' + cp.key + '</u></b><br />';
            }

            html = html + '<b>' + p.config.xDataKey + ':</b>' + cp.point[p.config.xDataKey] + '<br />' +
                '<b>' + p.config.yDataKey + ':</b>' + cp.point[p.config.yDataKey];

            if (cp.point.confidences) {
                html = html + cp.point.confidences.map(function (c) {
                    return '<br /><b>' + c.id + '%:</b>' + ' (' + c.low + ', ' + c.high + ')';
                }).join('');
            }

            return html + '</p>';
        }).reduce(function (last, curr) {
            return last + curr;
        });
    };

    p.pointWithinBuffer = function (point, pxDistance) {
        var withinBuffer = true;

        if (sonic.isSet(p.config.tooltip.buffer.amount)) {
            if (p.config.tooltip.buffer.type === 'value') {
                if (p.xScale.domainRangeToInterval(pxDistance) >
                        p.config.tooltip.buffer.amount) {
                    withinBuffer = false;
                }
            } else {
                if (pxDistance > p.config.tooltip.buffer.amount) {
                    withinBuffer = false;
                }
            }
        }

        return withinBuffer;
    };

    sonic.augment(forecast, p, viz, 'registerable', 'listenable');
    forecast.mergeConfig(initialConfig);
    viz.register('sonic-forecast', forecast);

    return forecast;
};

function sonic_line_forecast_add (v, c) {
    v.body().call(sonic.line.forecast(v, c));
}

sonic_api.add('addForecast', sonic_line_forecast_add);
