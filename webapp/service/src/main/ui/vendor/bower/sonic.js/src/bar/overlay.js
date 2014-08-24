/**
 * Adds overlay bars to the viz.  Overlay bars have an x and x2 value, and then 
 * are as tall as the viz body
 *
 * @todo right now is just vertical, upwards bars - allow horizontal
 *
 * @param {sonic.viz} the viz the bars are being added to
 * @param {object} c the bars config (see below for options)
 */
sonic.bar.overlay = function (viz, initialConfig) {
    var p = {
        xScale: null,
        yScale: null,
        config: {
            /**
             * The field that each data point uses for its x-axis value
             */
            xDataKey: 'x',
            /**
             * The field that each data point uses for its 2nd x-axis value
             * (the bar will go from x to x2)
             */
            xToDataKey: 'x2',
            /**
             * Value or array of values that indicate which series in the viz's data
             * should be used as data for this component
             *
             * e.g. "bestKey", ["bestKey"], ["bestKey", "worstKey"]
             */
            seriesKeys: null,
            /**
             * Value or array of values that indicate which series in the viz's data
             * should be used as data for this component, based off of
             * the index of the series in the viz data
             *
             * e.g. 1, [1], [1, 3]
             */
            seriesIndexes: null,
            /**
             * Fill color
             * Note: Will use series colors instead from data if they are defined
             */
            fill: 'orange',
            /** Fill opacity */
            fillOpacity: 0.5,
            /** Tooltip config */
            tooltip: {
                /**
                 * Custom function to render the tooltips
                 *
                 * @param {Object...} Array of closest point objects which
                 * has the closest point, the distance to the mouse, and the
                 * series information
                 * @param {Number...} Mouse position in form [x, y]
                 * @return {String} html
                 */
                renderFn: null
            }
        }
    };

    /**
     * Overlay Bar constructor renders the bars
     *
     * @param {d3.selection} sel where to render the bars to
     * @param {Object} opts extra information on how to render the bars
     *   generally used to specify custom transitions
     */
    function overlay(sel, opts) {
        var classes = [p.config.cls, 'sonic-bar-overlay'],
            groups;

        //update this bar instance's selection to match the current one
        p.selection = sel;

        p.computeData(opts || {});
        p.setScales();

        //groups are by series key
        groups = sel.selectAll(classes.join('.') + '.' + overlay.id())
            .data(p.data, function (s) {
                return s.key;
            });

        //create groups for any new series
        groups.enter().append('g')
            .classed(classes.join(' ') + ' ' + overlay.id(), true);

        //for each group, draw overlays
        groups.each(p.drawOverlays);

        //remove old series
        groups.exit().remove();

        //Since we attempted to draw bars, we alert the viz
        //if we were successful or not
        viz.registerVisibleContent(overlay, overlay.hasContent());
    }

    /**
     * Draw the overlay bars for each series
     */
    p.drawOverlays = function (series, seriesIndex) {
        //create overlay bars for each value in series
        var rects = d3.select(this).selectAll('rect')
            .data(function (d) {
                return d.values;
            });

        //add new bars
        rects.enter().append('rect')
            .attr('fill', function (d, i) {
                return p.getFillColor.call(this, d, i, series);
            })
            .attr('fill-opacity', p.config.fillOpacity)
            .attr('x', p.getX)
            .attr('y', p.getY)
            .attr('width', p.getWidth)
            .attr('height', 0);

        //update all bars
        rects.transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('x', p.getX)
            .attr('y', p.getY)
            .attr('width', p.getWidth)
            .attr('height', p.getHeight);

        //remove old bars
        rects.exit().remove();
    };

    /**
     * Sets the x scale for this instance. (Note no need for y scale since 
     * overlay bar takes up full viz.body height)
     *
     * If an actual scale passed in, uses that.  If a scale id passed in, use it,
     * otherwise find the appropiate scale from the datakey.
     */
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
                if (p.yScale) {
                    p.config.yScaleId = p.yScale.id();
                }
            }
        }
    };

    /**
     * Compute the data based off viz.data() array
     */
    p.computeData = function (opts) {
        p.data = [];
        if (opts.remove) {
            return;
        }
        p.data = viz.dataBySeries(p.config.seriesKeys, p.config.seriesIndexes);
    };

    /**
     * Get the x position for the overlay (given that widths have 
     * to be positive, we take min of x and x2 to get starting 
     * X value of overlay).
     */
    p.getX = function (d, i) {
        return Math.min(
            p.xScale.position(d[p.config.xDataKey]),
            p.xScale.position(d[p.config.xToDataKey])
        );
    };

    /**
     * Get the width for the overlay (given that widths have 
     * to be positive, we take abs difference between x and x2)
     */
    p.getWidth = function (d, i) {
        return Math.abs(p.xScale.position(d[p.config.xToDataKey]) -
            p.xScale.position(d[p.config.xDataKey]));
    };

    p.getHeight = function (d, i) {
        return p.yScale ? p.yScale.rangeExtent() : viz.body().height();
    };

    p.getY = function (d, i) {
        return p.yScale ? p.yScale.rangeMin() : 0;
    };

    /**
     * Get fill color - try series, then point itself, and finally
     * the color of the component
     */
    p.getFillColor = function (d, i, series) {
        return series.color || d.color || p.config.fill;
    };

    /**
     * Get stroke color - darker variant of fill color
     */
    p.getStrokeColor = function (d, i, series) {
        return d3.rgb(p.getFillColor(d, i, series)).darker().toString();
    };

    /**
     * On viz mouse move, find closest points
     * and update tooltips accordingly
     */
    p.onVizMouseMove = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        p.updateTooltips(mouse, cps);

        return cps;
    };

    /*
     * On viz mouse click, find closest points
     * and return them
     */
    p.onVizClick = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        return cps;
    };

    /**
     * Find closest points by returning all overlays that mouse 
     * is currently within
     */
    p.closestPoints = function (mouse) {
        var cps = [],
            x = mouse[0],
            y = mouse[1];

        p.data.forEach(function (s, i) {
            s.values.forEach(function (d) {
                var minX = p.xScale.position(d[p.config.xDataKey]),
                    maxX = p.xScale.position(d[p.config.xToDataKey]),
                    tmpX,
                    cp = {},
                    curDist;

                if (minX > maxX) {
                    tmpX = minX;
                    minX = maxX;
                    maxX = tmpX;
                }

                //dist from center
                curDist = Math.abs(((maxX - minX) / 2) - x);

                //within bar?
                if (minX <= x && maxX >= x) {
                    cp = {
                        point: d,
                        dist: curDist
                    };

                    sonic.each(s, function (k, v) {
                        if (k !== 'values') {
                            cp[k] = v;
                        }
                    });

                    cps.push(cp);
                }
            });
        });

        return cps;
    };

    /**
     * Update tooltips
     */
    p.updateTooltips = function (mouse, cps) {
        var content,
            renderFn = p.config.tooltip.renderFn || p.renderTooltips;

        if (p.config.tooltip) {
            if (mouse && cps.length > 0) {
                p.config.tooltip.closestPoints = cps;
                p.config.tooltip.content = renderFn(cps, mouse);
                p.config.tooltip.associatedId = overlay.id();
                p.config.tooltip.mouse = mouse;

                viz.showTooltip(p.config.tooltip);
            } else {
                viz.hideTooltip(p.config.tooltip);
            }
        }
    };

    /**
     * Default render tooltip function
     */
    p.renderTooltips = function (cps, mouse) {
        return cps.map(function (cp) {
            var html = '<p>';
            if (cps.length > 1 || (p.config.tooltip && p.config.tooltip.type === 'global')) {
                html = html + '<b><u>' + cp.key + '</u></b><br />';
            }

            html = html + '<b>' + p.config.xDataKey + ':</b>' + cp.point[p.config.xDataKey] + '<br />' +
                '<b>' + p.config.xToDataKey + ':</b>' + cp.point[p.config.xToDataKey] + '<br />';

            return html + '</p>';
        }).join('');
    };

    sonic.augment(overlay, p, viz, 'registerable', 'listenable');
    //merge config
    overlay.mergeConfig(initialConfig);
    //register this bar
    viz.register('sonic-bar-overlay', overlay);

    return overlay;
};

//add new bar overlay instance
function sonic_bar_overlay_add (v, c) {
    v.body().call(sonic.bar.overlay(v, c));
}

//update existing bar overlay instances
function sonic_bar_overlay_remove (v, c) {
    v.remove('sonic-bar-overlay', c);
}

/* Public API Methods */
sonic_api.add('addOverlayBars', sonic_bar_overlay_add);
sonic_api.add('removeOverlayBars', sonic_bar_overlay_remove);
