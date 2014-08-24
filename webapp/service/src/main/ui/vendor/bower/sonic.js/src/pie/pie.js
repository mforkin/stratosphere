/**
 * Adds pie to the viz.  Can display a full pie or a donut shape, depending on configs.
 *
 * @todo implement single and buffer for tooltip and onVizClick()
 *
 * @param {sonic.viz} the viz the pie is being added to
 * @param {object} c the pie configs (see below for options)
 */
sonic.pie = function (viz, initialConfig) {
    var p = {
        innerRadius: null, //computed inner radius
        outerRadius: null, //computered outer radius
        config: {
            /**
             * Unique id for this set of slices.
             * Note: A unique id will be generated by framework - this is
             * just useful for away to get the slices of the pie by an id that you know
             */
            id: null,
            /**
             * Length of radius from the center to the inside of the slices.
             */
            innerRadius: null,
            /**
             * Length of radius from the center to the outer circumference of the pie.
             */
            outerRadius: null,
            /**
             * The field that each data point uses for its percentage of the pie.
             */
            yDataKey: 'y',
            /**
             * Whether to show labels or not (@todo combine with other label config into
             * label config object)
             */
            showLabels: true,
            /**
             * Changes the text that appears on the slices.
             */
            labelDataKey: 'id',
            /**
             * Default length for inner radius if config innerRadius is not set.
             */
            innerScale: 0.6,
            /**
             * Default length for outer radius if config outerRadius is not set.
             */
            outerScale: 0.9,
            /**
             * Gives a measurement to how small the slice can be and still show the text.
             * The smaller the number, the smaller the slice can be.
             */
            thresholdToLabel: 0.17,
            /**
             * Configurable label font size.
             */
            labelSize: null,
            /**
             * Default colors chosen for the pie slices.
             */
            colors: sonic.colors.colorMap(),
            /** Tooltip config */
            tooltip: {
                /**
                 * Only show the tooltip if closest point is within a certain
                 * buffer area - can be by value, or by pixel
                 * @todo - implement this config in code
                 */
                buffer: null,
                type: 'grouped' //todo implement single (1 per line)
            }
        }
    };

    /**
     * Pie constructor renders the pie viz.
     * @param {d3.selection} sel where to render the pie to
     */
    function pie(sel) {
        var classes = [p.config.cls, 'sonic-pie'],
            slices,
            newSlices;

        //update this pie instance's selection to match the current one
        p.selection = sel;

        p.computeData();
        p.computeRadii();

        //slices are by values and corresponding id
        slices = sel.selectAll('.sonic-slice.' + pie.id())
            .data(p.data, function (d) {
                return d.data.id;
            });

        //create groups for each new slice
        newSlices = slices.enter().append('g')
            .classed('sonic-slice ' + pie.id(), true);

        slices.attr(
            'transform',
            'translate(' + (viz.body().width() / 2) + ',' + (viz.body().height() / 2) + ')'
        );

        //creates a path between each slice, forming the pie with all slices attached
        newSlices.append('path')
            .attr('d', p.arcGenerator())
            .style('fill', function (d, i) {
                return d.data.color || p.config.colors(d.data.id);
            })
            .attr('fill-opacity', 1)
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 1)
            .attr('stroke', function (d, i) {
                var dc = d.data.color || p.config.colors(d.data.id);
                return d3.rgb(dc).darker().toString();
            })
            .each(function (d) {
                this._current = d;
            });

        //appends texts to the middle of each slice
        newSlices.append('text')
            .attr('dy', '.35em')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold');

        //updates each slice
        slices.each(p.updateSlice);

        //remove old slices
        slices.exit().remove();

        //since we just tried to draw a pie, we ask the viz to check its
        //content so it can appropriately update the no data message
        viz.registerVisibleContent(pie, pie.hasContent);
    }

    /**
     * On viz mouse click, find closest points and return them.
     * @todo: implement
     */
    p.onVizClick = function () {
        //@TODO:implement
    };

    /**
     * On viz mouse move, find closest points
     * and update tooltips accordingly.
     */
    p.onVizMouseMove = function (mouse) {
        var cps = p.closestPoints(mouse);

        p.updateTooltips(mouse, cps);

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
        }
        p.selection.selectAll('.sonic-slice.' + pie.id() + ' path')
            .style('fill', function (d, i) {
                var dc = d.data.color || p.config.colors(d.data.id);

                if (p.isSliceSelected(d, mAng, dist)) {
                    cps.push(d);
                    return d3.rgb(dc).brighter().toString();
                } else {
                    return dc;
                }
            })
            .attr('stroke', function (d, i) {
                var dc = d.data.color || p.config.colors(d.data.id);

                if (p.isSliceSelected(d, mAng, dist)) {
                    return d.data.color || p.config.colors(d.data.id);
                } else {
                    return dc;
                }
            })
            .attr('stroke-width', function (d, i) {
                if (p.isSliceSelected(d, mAng, dist)) {
                    return 2;
                } else {
                    return 1;
                }
            });

        return cps;
    };

    /**
     * Is the passed in slice selected
     */
    p.isSliceSelected = function (d, angle, dists) {
        var inSlice = false,
            dist;

        if (!(sonic.isSet(d) && sonic.isSet(d.startAngle) &&
              sonic.isSet(d.endAngle) && sonic.isSet(dists) &&
              sonic.isSet(dists[0]) && sonic.isSet(dists[1]))) {
            return inSlice;
        }

        dist = sonic.geom.pythagorize(dists[0], dists[1]);

        return dist >= p.innerRadius && dist <= p.outerRadius &&
            angle >= d.startAngle && angle <= d.endAngle;
    };

    /**
     * Updates the path with animation and text.
     */
    p.updateSlice = function (slice, index) {
        d3.select(this).select('path')
            .transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attrTween('d', p.arcTween);

        /** @todo this will need to be done differently in case
         * someone transitions showLabels from true to false and
         * need to remove old labels
         */
        if (!p.config.showLabels) {
            return;
        }

        var t = d3.select(this).select('text');

        t.transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('transform', function (d) {
                return 'translate(' + p.arcGenerator().centroid(d) + ')';
            })
            .text(function (d) {
                if ((d.endAngle - d.startAngle) * 180 / Math.PI > (p.config.thresholdToLabel * 100)) {
                    return d.data[p.config.labelDataKey];
                } else {
                    return "";
                }
            });

        if (p.config.labelSize) {
            t.style('font-size', p.config.labelSize);
        }
    };

    /**
     * Generates the radius and then configures the arc accordingly.
     */
    p.arcGenerator = function () {
        return d3.svg.arc()
            .outerRadius(p.outerRadius)
            .innerRadius(p.innerRadius);
    };

    /**
     * Moves to the edge of the pie slice that was most recently drawn and then moves
     * forward the appropriate amount with the next slice.
     */
    p.arcTween = function (d) {
        var i = d3.interpolate(this._current, d);
        this._current = i(0);

        return function (t) {
            return p.arcGenerator()(i(t));
        };
    };

    /*
     * Transforms data using the d3 pie layout
     */
    p.computeData = function () {
        var pieLayout = d3.layout.pie()
            .sort(null)
            .value(function (d) { return d[p.config.yDataKey]; });

        p.data = pieLayout(
            viz.data()[0].values
        );
    };

    /**
     * Calculate the inner and outer radius for the donut.
     */
    p.computeRadii = function () {
        var radius = Math.min(viz.body().height(), viz.body().width()) / 2;

        p.outerRadius = p.config.outerRadius || (radius * p.config.outerScale);
        p.innerRadius = p.config.innerRadius || (radius * p.config.innerScale);
    };

    /**
     * Updates the tooltips based on mouse location and closest points.
     */
    p.updateTooltips = function (mouse, cps) {
        var content,
            renderFn = p.config.tooltip.renderFn || p.renderTooltips;

        if (p.config.tooltip) {
            if (mouse && cps.length > 0) {
                p.config.tooltip.closestPoints = cps;
                p.config.tooltip.content = renderFn(cps, mouse);
                p.config.tooltip.associatedId = pie.id();
                p.config.tooltip.mouse = mouse;

                viz.showTooltip(p.config.tooltip);
            } else {
                viz.hideTooltip(p.config.tooltip);
            }
        }
    };

    /**
     * Default render tooltip function
     *
     *@todo create better default
     */
    p.renderTooltips = function (cps, mouse) {
        return cps.map(function (cp) {
            var html = '<p>';
            html = html + '<b>' + cp.data.id + ': </b>' +
                ((cp.endAngle - cp.startAngle) / (2 * Math.PI) * 100).toFixed(2) +
                '%<br />';
            return html + '</p>';
        }).join('');
    };

    sonic.augment(pie, p, viz, 'registerable', 'listenable');

    pie.mergeConfig(initialConfig);

    viz.register('sonic-pie', pie);

    return pie;
};

//add new pie instance
function sonic_pie_add (v, c) {
    v.body().call(sonic.pie(v, c));
}

sonic_api.add('addPie', sonic_pie_add);