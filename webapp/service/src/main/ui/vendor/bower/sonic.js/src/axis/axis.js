/**
 * Adds axes to the viz.  Can be used to add generic axes, specific ones
 * like x and y
 *
 * @todo allow use of seriesKeys/seriesIndexes as part of scales
 *
 * @param {sonic.viz} viz the viz the lines are being added to
 * @param {Object} c - the axis config (see below for options)
 */
sonic.axis = function (viz, initialConfig) {
    var p = {
        scale: null, //scale for axis
        axe: null, //the d3 axis used
        minPad: null, //holds the smallest padding for an orientation
        config: {
            /**
             * Where to position the axis in relation to body
             *
             * e.g. top, bottom, left, and right
             */
            pos: 'bottom',
            /**
             * What percentage of viz body should axis (through its scale)
             * take up
             *
             * e.g. [0, .25] would take up a quarter of viz body, along whichever
             * edge the axis lies, [.25, .75] would take up middle 50%, etc.
             */
            range: null,
            /**
             * Orient the axis horizontally (horiz) or vertically (vert)
             */
            orient: 'horiz',
            /**
             * Css classes to attach to the axis for later selection
             */
            cls: 'x',
            /**
             * The field that each data point uses for its scale value
             */
            dataKey: 'x',
            /**
             * What type of axis?  linear, time, and ordinal are options for now
             */
            type: 'linear',
            /**
             * Another scale, and a value, to pin this axis to
             *
             * e.g. if the x axis should be pinned to 0 of y-axis, whether there
             * are negative values on y-axis or not
             */
            pinTo: {
                scale: null,
                value: null
            },
            /**
             * If set, moves axis inside the viz body the amount of pixels
             * designated. dx moves the axis to the right or left, dy moves
             * the axis up and down.
             */
            offset: {
                dx: null,
                dy: null
            },
            /**
             * Padding to add to axis data as a percentage of data range
             */
            pad: {},
            /**
             * Config for the axis ticks
             */
            ticks: {
                /** Whether to show tick labels */
                showLabels: true,
                /** Explicitly set number of ticks */
                count: undefined,
                /** Minimum spacing between ticks along x axis */
                minHorizSpacing: 80,
                /** Minimum spacing between ticks along y axis */
                minVertSpacing: 30,
                /** Padding between the axis and the tick start */
                padding: null,
                /**
                 * A function to render the particular tick value
                 *
                 * Function has 1 input, which is the tick value
                 */
                formatFn: null,
                /** Whether to subdivide the axis into further pieces */
                subdivide: null,
                /** Explicitly set tick values */
                values: null,
                /** Explicitly set minimum tick value */
                min: null,
                /** Explicitly set maximum tick value */
                max: null,
                /** Snap the ticks @todo look into this */
                snapTo: null,
                rotate: null,
                textAnchor: null,
                dx: null,
                dy: null
            },
            /** Label config */
            label: {
                /** Text for label **/
                text: null,
                /** Position the label alongside the axis */
                pos: 'middle',
                /**
                 * Rotate the text as need
                 * @todo this happens automatically...need to handle config better
                 * */
                rotate: null,
                /** X value for placing the label absolutely */
                x: null,
                /** Y value for placing the label absolutely */
                y: null,
                /** dx value for placing the label relative to the axis */
                dx: null,
                /** dy value for placing the label relative to the axis */
                dy: null,
                /**
                 * amount of pixels to account for y-axis padding
                 * TODO: delete once y-axis padding is reconfigured
                 */
                padding: 35
            }
        }
    };

    /**
     * Axis constructor renders the axis w/ labels/ticks
     *
     * @param {d3.selection} sel where to render the lines to
     * @param {Object} opts extra information on how to render the axis
     *   generally used to specify custom transitions
     */
    function axis(sel, opts) {
        //update this axis instance's selection to match the current one
        p.selection = sel;
        p.minPad = 0;

        //set height and width to body height/width
        p.config.height = viz.body().height();
        p.config.width = viz.body().width();

        //set orientation based on positioning
        if (p.config.pos === 'left' || p.config.pos === 'right') {
            p.config.orient = 'vert';
        }

        //set up scales
        p.setScales();

        //compute edge length of axis based on the generated range
        p.config.edgeLength = p.scale.rangeExtent();

        //create an underlying d3 axis from the scale and config
        p.axe = d3.svg.axis().scale(p.scale.scale()).orient(p.config.pos);

        //compute padding between margin and axis in viz
        p.computePadding();
        //compute the label position
        p.computeLabelPosition();
        //compute the ticks
        p.computeTicks();

        //draw the axis
        p.drawAxis(sel, opts || {});

        //we never want to tell the viz we have rendered content
        //because we shouldn't impact the no data message
        viz.registerVisibleContent(axis, false);
    }

    axis.currentPadding = function () {
        return viz.currentPadding();
    };

    axis.scale = function () {
        return p.scale;
    };

    /** Getter on the instance's range */
    axis.range = function() {
        return p.config.range;
    };

    /** Getter on the instance's position */
    axis.pos = function() {
        return p.config.pos;
    };

    /** Getter for the data key */
    axis.dataKey = function () {
        return p.config.dataKey;
    };

    /**
     * Updates the padding in the viz with the calculated value
     * @param {Number} New padding value
     */
    p.updatePadding = function (padTotal) {
        var adjust,
            newPadding = {};

        newPadding[p.config.pos] = padTotal;
        viz.currentPadding(newPadding, axis.id());
        p.config.height = viz.body().height();
        p.config.width = viz.body().width();
    };

    /**
     * Checks to see if padTotal should be auto-calculated and then calls
     * updatePadding if the padding for the position has changed.
     *
     * @param {String} either horiz or vert depending on instance's position
     * @param {Number} or {String} Number if user is setting padding, otherwise 'auto'
     */
    p.checkAndSetPadding = function (orient, padTotal) {
        var tickSize = p.axe.tickSize(),
            tickPadding = p.computeTickPadding(),
            tickFont = 11, //11px is the general font size of the tick text
            axisFont = 12, //12px is the general font size of the label text
            dyPadding = sonic.isSet(p.config.label.dy) ? p.config.label.dy : 0,
            dxPadding = sonic.isSet(p.config.label.dx) ? p.config.label.dx : 0,
            labelPad = p.config.label.padding;

        // 10 accounts for 10 pixels of buffer space so that the labels don't get cutoff in viz
        if (viz.padding()[p.config.pos] === 'auto' && orient === 'horiz') {
            padTotal = tickSize + tickPadding + tickFont + dyPadding + axisFont + 10;
        } else if (viz.padding()[p.config.pos] === 'auto' && orient === 'vert') {
            padTotal = tickSize + tickPadding + dxPadding + labelPad + 10;
        }

        p.minPad = padTotal;

        if (p.findSamePosAxis(p.config.pos, padTotal) > viz.currentPadding()[p.config.pos]) {
            p.updatePadding(padTotal);
        }
    };

    /**
     * Finds axes that have the same orientation
     * Used to check for stacked axis vizes. Also sets padding to be the largest
     * padding set out of all axis on the same side.
     *
     * @param {String} Position of current axis
     * @param {Integer} Amount of padding proposed for axis
     * @return {Integer} Amount of padding that will actually be there.
     */
    p.findSamePosAxis = function (pos, padCalc) {
        var arrAxis = viz.registry().find('sonic-axis'),
            padding;

        arrAxis.forEach(function (a) {
            if (a.pos() === pos) {
                if (a.currentPadding()[pos] < padCalc) {
                    padding = padCalc;
                } else {
                    padding = a.currentPadding()[pos];
                }
            }
        });

        return padding;
    };

    /**
     * Computes the padding in between the margin and the axis
     * based on text, ticksize, fontsize, and config padding.
     */
    p.computePadding = function () {
        var padTotal = viz.padding()[p.config.pos],
            min,
            max;

        // either 'top' or 'bottom' (x-axis)
        if (p.config.orient === 'horiz') {

            p.checkAndSetPadding(p.config.orient, padTotal);

            //resets scale, takes into account offset
            if (!sonic.isSet(p.config.range)) {
                min = sonic.isSet(p.config.offset.dx) ? p.config.offset.dx : 0;
                max = viz.body().width();
                p.scale.resetScale([min,max]);
            }
        } else {

            p.checkAndSetPadding(p.config.orient, padTotal);

            if (!sonic.isSet(p.config.range)) {
                min = sonic.isSet(p.config.offset.dy) ? p.config.offset.dy : 0;
                max = viz.body().height();
                p.scale.resetScale([min, max]);
            }
        }
    };

    /**
     * Computes the axis offset based on axisConfig used when creating the axis
     * If no offset is specified, then we autocompute the offset based on the
     * specified positioning
     *
     * If dx is not specified then we inspect the position of the axis.
     * If the position is right then we
     * auto-offset the axis by the chart width
     *
     * If dy is not specified then we inspect the position of the axis.
     * If the position is bottom then we
     * auto-offset the axis by the chart height
     *
     * @param {Object} axisConfig = configuration passed when creating the axis
     * @return {Object} The x,y offset for the axis
     */
    p.computeOffset = function () {
        var dx = p.config.offset.dx,
            dy = p.config.offset.dy,
            otherScale,
            otherScalePos,
            otherScaleUpdated = false;

        if (!sonic.isSet(dx)) {
            dx = (p.config.pos === 'right') ? p.config.width : 0;
        }
        if (!sonic.isSet(dy)) {
            dy = (p.config.pos === 'bottom') ? p.config.height : 0;
        }

        if (sonic.isSet(p.config.pinTo.scale)) {
            otherScale = viz.findOne('scale', { dataKey: p.config.pinTo.scale });

            if (otherScale) {
                if (p.config.pinTo.value < otherScale.domainMin()) {
                    otherScale.domainMin(p.config.pinTo.value);
                    otherScaleUpdated = true;
                } else if (p.config.pinTo.value > otherScale.domainMax()) {
                    otherScale.domainMax(p.config.pinTo.value);
                    otherScaleUpdated = true;
                }

                if (otherScaleUpdated) {
                    viz.findOne('sonic-axis', { dataKey: p.config.pinTo.scale }).update();
                }

                otherScalePos = otherScale.position(p.config.pinTo.value);
                if (p.config.orient === 'horiz') {
                    dy = otherScalePos;
                } else {
                    dx = otherScalePos;
                }
            }
        }

        return {
            x: dx,
            y: dy
        };
    };

    /**
     * Draw the axis to the passed in selection
     *
     * @todo this can actually be called using sel.call instead of passing in the
     * sel itself
     */
    p.drawAxis = function (sel, opts) {
        var offset = p.computeOffset(), //get offset from viz to show axis
            classes = [p.config.cls, p.config.id, 'major', 'sonic-axis'],
            groupData = [],
            existing,
            ticks;

        //if removing, leave data empty so no axis is rendered
        if (!opts.remove) {
            groupData.push(1);
        }

        if (p.config.ticks.showMinor) {
            classes.push('minor');
        }

        existing = sel.selectAll('g.' + p.config.id)
            .data(groupData);

        existing.enter()
            .insert('g', ':first-child')
            .classed(classes.join(' '), true)
            //by setting this here, axis won't transition from top of viz down to
            //whereeve it needs to go
            .attr('transform', 'translate(' + offset.x + ', ' + offset.y + ')');

        //add label
        existing.each(p.drawLabel);

        //transition the axis
        existing
            .transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('transform', 'translate(' + offset.x + ', ' + offset.y + ')')
            .call(p.axe);

        ticks = existing
            .selectAll('g.tick text')
            .transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration);

        if (sonic.isSet(p.config.ticks.textAnchor)) {
            ticks.style('text-anchor', p.config.ticks.textAnchor);
        }

        if (sonic.isSet(p.config.ticks.rotate)) {
            ticks.attr('transform', function () {
                return 'rotate(' + (p.config.ticks.rotate || 0) + ')';
            });
        }

        if (sonic.isSet(p.config.ticks.dx)) {
            ticks.attr('dx', p.config.ticks.dx);
        }

        if (sonic.isSet(p.config.ticks.dy)) {
            ticks.attr('dy', p.config.ticks.dy);
        }

        existing.exit().remove();
    };

    /**
     * Compute size of ticks
     *
     * @todo enable grammar-of-graphics style ticks by default -
     * grey viz wide lines instead of dark small ticks - some places
     * will want to override that to have these small black ticks again
     * so change as needed
     */
    p.computeTickSize = function () {
        var size = p.config.ticks.size;

        if (p.config.ticks.showMinor) {
            if (p.config.orient === 'vert') {
                size = [-1 * p.config.width, -1 * p.config.width, 0];
            } else {
                size = [-1 * p.config.height, -1 * p.config.height, 0];
            }
        }

        return size;
    };

    /**
     * Compute the number of ticks to show
     */
    p.computeTickCount = function () {
        var n = p.config.ticks.count,
            maxTicks;

        if (p.config.type === 'ordinal') {
            return n;
        }

        if (p.config.orient === 'horiz') {
            maxTicks = p.config.edgeLength / p.config.ticks.minHorizSpacing;
        } else {
            maxTicks = p.config.edgeLength / p.config.ticks.minVertSpacing;
        }

        n = maxTicks;

        if (p.config.ticks.count > maxTicks) {
            n = maxTicks;
        } else {
            //@todo not sure the stuff in here makes sense
            if (p.config.type === 'linear' && p.config.ticks.snapTo === 'integer') {
                n = (n > p.scale.domainExtent()) ? p.scale.domainExtent() : n;
            } else if (p.config.type === 'time' && p.config.ticks.snapTo === 'day') {
                n = (n > p.scale.numDays().length) ? p.scale.numDays().length : n;
            }
        }

        return Math.floor(n);
    };

    /**
     * Use user specified tick padding, or default of 3
     */
    p.computeTickPadding = function () {
        var pad = 3;

        if (sonic.isSet(p.config.ticks.padding)) {
            pad = p.config.ticks.padding;
        }

        return pad;
    };

    /** Compute tick labels */
    p.computeTickLabels = function () {
        var fn = p.config.ticks.formatFn;

        if (p.config.ticks.showLabels === false) {
            fn = function () {
                return '';
            };
        }

        return fn;
    };

    /**
     * Actually set up the ticks themselves by setting their
     * properties on the d3 axis
     */
    p.computeTicks = function () {
        sonic.doIfSet(p.axe.ticks, p.computeTickCount());
        sonic.doIfSet(p.axe.tickPadding, p.computeTickPadding());
        sonic.doIfSet(
            function (ts) {
                p.axe.tickSize.apply(this, ts);
            },
            p.computeTickSize()
        );
        sonic.doIfSet(p.axe.tickFormat, p.computeTickLabels());
        sonic.doIfSet(p.axe.tickSubdivide, p.config.ticks.subdivide);
        sonic.doIfSet(p.axe.tickValues, p.config.ticks.values);
    };

    /**
     * Sets the scale for this instance  If an actual scale
     * passed in, uses that.  If a scale id passed in, use it,
     * otherwise find the appropiate scale from the datakey.
     */
    p.setScales = function () {
        if (sonic.isSet(p.config.scale)) {
            p.scale = p.config.scale;
            p.config.scaleId = p.scale.id();
            delete p.config.scale;
        } else {
            if (p.config.scaleId) {
                p.scale = viz.findOne('scale', p.config.scaleId);
            } else {
                p.scale = viz.findOne('scale', { dataKey: p.config.dataKey });

                if (!p.scale) {
                    sonic_scale_add(viz, p.config);
                    p.scale = viz.findOne('scale', { dataKey: p.config.dataKey });
                    p.config.scaleId = p.scale.id();
                }
            }
        }

        if (p.scale.type() !== 'ordinal' && sonic.isSet(p.config.min) && p.scale.domain()[0] !== p.config.min) {
            p.domainMin = p.config.min;
            delete p.config.min;
            p.scale.mergeConfig({min: p.domainMin});
            p.scale.resetDomain();
            viz.refreshRegistry(axis.id());
        }

        if (sonic.isSet(p.config.range) &&
                (p.config.range[0] !== p.scale.rangeInputs()[0] ||
                p.config.range[1] !== p.scale.rangeInputs()[1])) {

            p.scale.range(p.config.range);
            viz.refreshRegistry(axis.id());
        }
    };

    /**
     * Draw a label for the axis passed in
     */
    p.drawLabel = function (series, i) {
        var labels,
            pos = 'middle',
            transform;

        labels = d3.select(this).selectAll('text')
            .data([1]);

        labels.enter().append('text');

        labels
            .classed(p.config.id + ' ' + p.config.cls + ' sonic-label', true)
            .attr('transform', 'rotate(' + (p.config.label.rotate || 0) + ')')
            .attr('x', p.config.label.x)
            .attr('y', p.config.label.y)
            .attr('dx', p.config.label.dx)
            .attr('dy', p.config.label.dy)
            .style('text-anchor', p.config.label.anchor)
            .text(p.config.label.text);
    };

    /**
     * Compute the label position in relation to the viz body
     *
     * Note that the 10 represents the label pixels that were set in padding calculations
     *
     * @todo re-enable the ability for someone to explicitly set the
     *      x-value of the label
     */
    p.computeLabelPosition = function () {
        if (!sonic.isSet(p.config.label.anchor)) {
            p.config.label.anchor = 'middle';
        }

        if (p.config.orient === 'horiz') {
            if (p.config.pos === 'bottom') {
                p.config.label.y = viz.currentPadding()[p.config.pos] - p.config.label.dy - 10;
            } else {
                p.config.label.y = -1 * viz.currentPadding()[p.config.pos] - p.config.label.dy + 10;
            }
            p.config.label.x = p.scale.rangeExtent() / 2 + p.config.label.dx + p.scale.rangeMin();
            if (isNaN(p.config.label.x)) {
                p.config.label.x = viz.body().width() / 2;
            }
        }

        if (p.config.orient === 'vert') {
            if (p.config.pos === 'left') {
                if ((viz.currentPadding().left - p.minPad) === 0) {
                    p.config.label.y = -1 * (viz.currentPadding()[p.config.pos] - 10);
                    if (viz.padding().left !== 'auto') {
                        p.config.label.y += p.config.label.dx;
                    }
                } else {
                    p.config.label.y = -1 * (p.minPad - p.config.label.dx - 10);
                }
            } else {
                if ((viz.currentPadding().right - p.minPad) === 0) {
                    p.config.label.y = viz.currentPadding()[p.config.pos] - 10;
                    if (viz.padding().right !== 'auto') {
                        p.config.label.y += p.config.label.dx;
                    }
                } else {
                    p.config.label.y = p.minPad - 10 - p.config.label.dx;
                }
            }
            p.config.label.x = -1 * p.scale.rangeExtent() / 2 + p.config.label.dy - p.scale.rangeMin();
            if (isNaN(p.config.label.x)) {
                p.config.label.x = 0;
            }
            p.config.label.rotate = -90;
        }
    };

    sonic.augment(axis, p, viz, 'registerable');

    //merge config
    axis.mergeConfig(initialConfig);
    //register this axis
    viz.register('sonic-axis', axis);

    return axis;
};

/**
 * Add an axis(s) to the viz body
 */
sonic_axis_add = function (v, c) {
    v.body().call(sonic.axis(v, c));
};

/**
 * Add an x-axis to the viz body
 *
 * Same as regular add except for
 * adding some x specific defaults
 */
sonic_axis_addX = function (v, c) {
    c = sonic.object.merge(
        {
            dataKey: 'x',
            cls: 'x'
        },
        c
    );
    v.body().call(sonic.axis(v, c));
};

/**
 * Add a y-axis to the viz body
 *
 * Same as regular add except for
 * adding some y specific defaults
 */
sonic_axis_addY = function (v, c) {
    c = sonic.object.merge(
        {
            dataKey: 'y',
            cls: 'y',
            pos: 'left'
        },
        c
    );
    v.body().call(sonic.axis(v, c));
};

/**
 * Update matching axes in viz v, based on params p,
 * to have config c
 */
sonic_axis_update = function (v, p, c) {
    v.find('sonic-axis', p).forEach(function (d) {
        d.mergeConfig(c);
        d.update();
    });
};

 /**
 * Update the matching y axes in viz v, based on params p,
 * to have config c
 */
sonic_axis_updateY = function (v, p, c) {
    v.find(
        'sonic-axis',
        sonic.object.merge({ dataKey: 'y' }, p)
    ).forEach(function (d) {
        d.mergeConfig(c);
        d.update();
    });
};

/** Remove the matching axes from viz v, based
 * on params p
 */
sonic_axis_remove = function (v, p, c) {
    v.remove('sonic-axis', p);
};

/* Public API Methods */
sonic_api.add('addAxis', sonic_axis_add);
sonic_api.add('addXAxis', sonic_axis_addX);
sonic_api.add('addYAxis', sonic_axis_addY);
sonic_api.add('updateAxis', sonic_axis_update);
sonic_api.add('updateYAxis', sonic_axis_updateY);
sonic_api.add('removeAxis', sonic_axis_remove);
