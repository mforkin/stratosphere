/**
 * Tooltip component
 *
 * Manages a list of tooltips added to a particular viz
 *
 * Can be used by a component to render a tooltip (or
 * multiple) for itself, or to push the tooltip content into
 * a global tooltip for the viz that aggregates all the components'
 * tooltip content together.
 *
 * @param {Object} config - The configuration for the tooltip instance:
 *     position: either mouse or fixed.  If mouse, the tooltip will
 *         follow the mouse.  If fixed, will be positioned according to offset
 *         config
 *     offset: px distance away from position of tooltip to actually render
 *         the tooltip, e.g. [5, 10] would show tooltip 5px down and 10px over
 *         from actual position
 *     renderFn: function to use for rendering the global tooltip, if one has
 *         been specified
 */
sonic.tooltip = function (viz, initialConfig) {
    var p = {
        tips: d3.map(), //used to keep track of tips
        config: {
            position: 'mouse',
            offset: [10, 0],
            renderFn: null
        }
    };

    /**
     * Constructor
     */
    function tooltip(sel) {
        var groups;

        p.selection = sel;
        p.computeData();

        groups = p.selection.selectAll('.sonic-tooltip')
            .data(p.data, function (d) {
                return d.key;
            });

        //insert new tooltips before svg
        groups.enter().insert('div', ':first-child')
            .classed('sonic-tooltip', true);
        groups.each(p.drawTooltips);
        groups.exit().remove();
    }

    /**
     * Get current list of tooltips
     */
    tooltip.tooltips = function () {
        return p.tips;
    };

    /**
     * Add a new tooltip
     *
     * Expects at least c.associatedId
     * to know how to register the tip,
     * and update in future
     */
    tooltip.add = function (c) {
        if (!p.tips.has(c.associatedId)) {
            p.tips.set(c.associatedId, c);

            d3.select(viz.elId()).call(tooltip);
        }
    };

    /**
     * Update an existing tooltip
     *
     * Expects at least c.associatedId
     * to know which tip to update
     */
    tooltip.update = sonic.override(function (c) {
        if (p.tips.has(c.associatedId)) {
            p.tips.set(c.associatedId, c);

            d3.select(viz.elId()).call(tooltip);
        }
    });

    /**
     * Remove an existing tooltip
     *
     * Expects at least c.associatedId
     * to know which tip to remove
     */
    tooltip.remove = sonic.override(function (c) {
        if (p.tips.has(c.associatedId)) {
            p.tips.remove(c.associatedId);

            d3.select(viz.elId()).call(tooltip);
        }
    });

    /**
     * Show a tooltip according to config
     *
     * Expects at least c.associatedId
     * to know which component is adding tip
     *
     * If associated tooltip found, updates it,
     * otherwise, adds a new one
     */
    tooltip.show = function (c) {
        c.visible = true;
        if (!p.tips.has(c.associatedId)) {
            tooltip.add(c);
        } else {
            tooltip.update(c);
        }
    };

    /**
     * Hide a tooltip according to config
     *
     * Expects at least c.associatedId
     * to know which component to hide
     */
    tooltip.hide = function (c) {
        c.visible = false;
        tooltip.update(c);
    };

    /**
     * Create the underlying data structure that will
     * be used by constructor to render tooltips,
     * based off of the current tooltip list.
     *
     * For each tip, if its type is global, it gets pushed
     * into 1 global tooltip.  Otherwise, it gets
     * its own spot.
     */
    p.computeData = function () {
        var globalEntries = [];

        p.data = [];

        p.tips.forEach(function (k, v) {
            var entry = {
                key: k,
                value: v
            };

            if (v.visible) {
                if (v.type === 'global') {
                    globalEntries.push(entry);
                } else {
                    p.data.push(entry);
                }
            }
        });

        if (globalEntries.length > 0) {
            p.data.push({
                key: 'global',
                values: globalEntries.sort(function (a, b) {
                    var aPriority = sonic.isSet(a.value.priority) ? a.value.priority : -1,
                        bPriority = sonic.isSet(b.value.priority) ? b.value.priority : -1;
                    if (aPriority === bPriority) {
                        return 0;
                    } else if (aPriority === -1 && bPriority !== -1) {
                        return 1;
                    } else if (bPriority === -1 && aPriority !== -1) {
                        return -1;
                    } else if (aPriority < bPriority) {
                        return -1;
                    } else if (bPriority < aPriority) {
                        return 1;
                    }
                    return 0;
                })
            });
        }
    };

    /**
     * Draw each tooltip being rendered by
     * constructor
     *
     * Since tooltip content can be grouped into 1 tooltip,
     * this is based off of the generated data, not the
     * tips list
     */
    p.drawTooltips = function (d, i) {
        var key = d.key,
            sel = d3.select(this),
            c;

        if (key === 'global') {
            c = p.drawGlobalTooltip(d, sel);
        } else {
            c = p.drawComponentTooltip(d, sel);
        }

        sel
            .style('display', function () {
                return c.visible ? 'block' : 'none';
            });

        //for setting top/bottom/left/right
        c.position.forEach(function (k, v) {
            sel.style(k, v === null ? null : (v + 'px'));
        });

        sel.html(c.html);
    };

    /**
     * Draw the global tooltip
     *
     * Collect html content into 1 tooltip and render together
     *
     * @todo can combine some of this with component tooltip fn below
     */
    p.drawGlobalTooltip = function (d, sel) {
        var points = [],
            mouse,
            c = {
                visible: false,
                html: '',
                position: null
            };

        d.values.forEach(function (val) {
            if (val.value.visible) {
                c.visible = true;
            }

            //if developer supplised renderFn, collect points to be used below
            //otherwise, treat as html to be added together
            if (p.config.renderFn) {
                points = points.concat(val.value.closestPoints);
            } else {
                c.html += val.value.content;
            }
        });

        mouse = d.values[0].value.mouse;

        //if developer supplied renderFn, use it
        if (p.config.renderFn) {
            c.html = p.config.renderFn(points, mouse);
        }

        //default to fixed position if not set to 'mouse'
        if (p.config.position === 'mouse') {
            c.position = p.calculateMousePosition(mouse);
        } else {
            c.position = p.calculateFixedPosition(p.config.position);
        }

        return c;
    };

    /**
     * Draw a component tooltip
     *
     * @todo can combine some of this with global tooltip fn above
     */
    p.drawComponentTooltip = function (d, sel) {
        var points = [],
            c = {
                visible: false,
                html: '',
                position: null
            };

        if (d.value.visible) {
            c.visible = true;
        }

        //if renderFn supplied, use it to get html, otherwise, treat content as html
        if (p.config.renderFn) {
            c.html = p.config.renderFn(d.value.closestPoints);
        } else {
            c.html = d.value.content;
        }

        //default component tooltip to mouse unless set
        if (d.value.position === 'fixed' || sonic.isArray(d.value.position)) {
            c.position = p.calculateFixedPosition(d.value.position, d.value.offset);
        } else {
            c.position = p.calculateMousePosition(d.value.mouse, d.value.offset, sel);
        }

        return c;
    };

    /**
     * Calculate position of tooltip in relation to the mouse
     */
    p.calculateMousePosition = function (mouse, offset, sel) {
        var pos = d3.map(),
            xBind = 'left',
            yBind = 'top',
            xPos,
            yPos,
            padding = viz.currentPadding(),
            margin = viz.margin();

        offset = offset || p.config.offset;
        xPos = mouse[0] + offset[0];
        yPos = mouse[1] - offset[1];

        pos.set('left', null);
        pos.set('right', null);
        pos.set('top', null);
        pos.set('bottom', null);

        //if on right side of viz, orient tooltip to left of mouse
        if (mouse[0] >= viz.body().width() / 2) {
            xBind = 'right';
            xPos = viz.body().width() - mouse[0] + padding.right + margin.right + offset[0];
        } else {
            xPos = xPos + padding.left + margin.left;
        }

        //if on top side of viz, orient tooltip to left of mouse
        if (mouse[1] >= viz.body().height() / 2) {
            yBind = 'bottom';
            yPos = viz.body().height() - mouse[1] + padding.bottom + margin.bottom - offset[1];
        } else {
            yPos = yPos + padding.top + margin.top;
        }

        pos.set(xBind, xPos);
        pos.set(yBind, yPos);

        return pos;
    };

    /**
     * Calculate position of tooltip as fixed position in viz
     *
     * position can be passed as a string: 'top' or number: 50
     *
     * @todo allow center positioning
     */
    p.calculateFixedPosition = function (position, offset) {
        var pos = d3.map();

        offset = offset || p.config.offset;

        //default to top/left
        if (!sonic.isSet(position) || position === 'fixed') {
            position = ['left', 'top'];
        }
        offset = offset || [0, 0];

        if (!isNaN(position[0])) {
            pos.set('left', viz.margin().left + position[0]);
        } else if (position[0] === 'right') {
            pos.set('right', viz.margin().right + offset[0]);
        } else {
            pos.set('left', viz.margin().left + offset[0]);
        }

        if (!isNaN(position[1])) {
            pos.set('top', viz.margin().top + position[1]);
        } else if (position[1] === 'bottom') {
            pos.set('bottom', viz.margin().bottom + offset[1]);
        } else {
            pos.set('top', viz.margin().top + offset[1]);
        }

        return pos;
    };

    sonic.augment(tooltip, p, viz, 'registerable');
    tooltip.mergeConfig(initialConfig);

    return tooltip;
};

/**
 * Add a tooltip
 */
function sonic_tooltip_add(v, c) {
    v.tooltipSingleton().add(c);
}

/**
 * Remove a tooltip
 */
function sonic_tooltip_remove(v, c) {
    v.tooltipSingleton().remove(c);
}

/**
 * Show a tooltip
 */
function sonic_tooltip_show(v, c) {
    v.tooltipSingleton().show(c);
}

/**
 * Hide a tooltip
 */
function sonic_tooltip_hide(v, c) {
    v.tooltipSingleton().hide(c);
}

/* Public API Methods */
sonic_api.add('addTooltip', sonic_tooltip_add);
sonic_api.add('removeTooltip', sonic_tooltip_remove);
sonic_api.add('showTooltip', sonic_tooltip_show);
sonic_api.add('hideTooltip', sonic_tooltip_hide);
