/**
 * Base viz component that takes in an element id, some data, and optional
 * configuration, and creates a barebones svg container and viz object for
 * further manipulating that svg container.
 *
 * To add components to the viz, you'll use api methods like viz.addBars(),
 * viz.addAxis(), etc. that get defined within component files and attached
 * to the viz using the sonic_api singleton.
 *
 * To interact directly with the svg, you can do viz.container().<whatever>,
 * and to interact with the body of the svg, viz.body().<whatever>.
 *
 * The body refers to the group within the svg itself where the main content will
 * go, and is offset inwards based on the margins supplied.
 *
 * @todo fix height/width setting
 * @todo handle view resize
 *
 * @param {String} elId element to put svg into
 * @param {Array} data data for svg (optional - can set later)
 * @param {Object} config (optional)
 */
sonic.viz = function () {
    var p = {
        elId: null, //element id of div to put svg in
        api: null, //collection of api methods
        registry: null, // collection of components added to viz
        listener: null, //collection of listeners on viz
        tooltip: null, //tooltip manager for viz
        zoom: {
            zoomer: null,
            cbs: {
                zoomstart: {},
                zoom: {},
                zoomend: {}
            }
        },
        config: {
            /**
             * Whether to automatically determine size of viz based on surrounding div
             * @todo think through resizing
             */
            sizeMode: 'auto',
            /** Width of svg (optional if sizeMode = auto) */
            width: null,
            /** Height of svg (optional if sizeMode = auto) */
            height: null,
            /**
             * Margins between the svg boundary and its padding.
             */
            margin: {
                top: 10,
                right: 10,
                bottom: 7,
                left: 7
            },
            /**
             * Holds all current values for padding.
             */
            currentPadding: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            },
            /**
             * Area between margins and its internal "body"
             * Can only be written over once by user in creation
             * of viz. All current values / user configs are stored
             * in currentPadding above.
             */
            padding: {
                top: 'auto',
                right: 'auto',
                bottom: 'auto',
                left: 'auto'
            },
            /*
             * Animation configuration for viz wide (can be overridden in
             * individual components)
             */
            animation: {
                delay: 0,
                duration: 1000
            },
            /**
             * Whether to show a viz wide tooltip (vs. each component
             * handling its own)
             */
            tooltip: false,
            /**
             * The message to display when there is no data to render
             */
            noContentMessage: "No Data Available",
            /**
             * When set to true, viz will have a clear button in the lower right corner.
             * @todo clear functionality should probably be handled on a component by
             * component basis instead of on viz wide basis
             */
            visibleClear: false
        },
        //whether to allow updates while parent div hidden (@todo rethink)
        hiddenUpdates: false
    };

    /**
     * Viz constructor renders the svg container and its interior body
     *
     * @param {d3.selection} sel where to render the lines to
     */
    function viz(sel) {
        //check if we are not visible, so when we become visible, can re-render
        //@todo this doesn't really work and needs to be rethought
        if (!sonic.svg.height(sel) || !sonic.svg.width(sel)) {
            p.hiddenUpdates = true;
            return;
        }

        if (p.config.sizeMode === 'auto') {
            viz.height(sonic.svg.height(sel));
            viz.width(sonic.svg.width(sel));
        } else {
            viz.height(p.config.height);
            viz.width(p.config.width);
        }

        //if first render, add container and listeners
        if (viz.container().empty()) {
            sel.call(p.drawContainer);
            //add a link to be able to clear viz - this should be configurable
            if (p.config.visibleClear === true) {
                p.addClearLink();
            }
            p.addDefaultListeners();
        }

        //set the height and width of the container
        viz.container().attr('width', viz.width())
            .attr('height', viz.height());

        //update the viz body's data and margins
        viz.body()
            .data(p.data);

        p.translateBody();

        //update any existing components
        p.registry.update();

        //Since we aren't hidden, we set the flag to false
        p.hiddenUpdates = false;
    }

    /**
     * Set up singletons
     *
     * Note: These must be after the viz constructor definition to pass jshint,
     * but before some of the viz.* methods below that reference them
     */
    p.api = sonic_api;
    p.registry = sonic.registry();
    p.listener = sonic.listener(viz, p.registry);
    p.tooltip = sonic.tooltip(viz);

    /**
     * Get the current data, or set new data, for this viz
     *
     * Unless doUpdate is explicitly set to false, this will
     * automatically update the viz's components
     * to match the new data
     */
    viz.data = function (d, doUpdate) {
        if (!sonic.isSet(doUpdate)) {
            doUpdate = true;
        }

        //if new data not set, means we want a getter.  Return current data
        if (!sonic.isSet(d)) {
            return p.data;
        }

        //make sure data is in nest format
        p.data = sonic.nest(d);

        if (doUpdate) {
            viz.update();
        }

        return viz;
    };

    /**
     * Get the series out of viz data based on key
     */
    viz.dataByKey = function (key) {
        var dat = viz.data().filter(function (d, i) {
            if (d.key === key) {
                return true;
            }
        });

        if (dat.length > 0) {
            return dat[0];
        } else {
            return;
        }
    };

    /**
     * Get the series out of viz data based on index
     */
    viz.dataByIndex = function (index) {
        var dat = viz.data().filter(function (d, i) {
            if (i === index) {
                return true;
            }
        });

        if (dat.length > 0) {
            return dat[0];
        }

        return;
    };

    /*
     * Get relevant series out of viz data by keys and/or indexes
     *
     * Can pass string, number, regex, or array for either argument,
     * and returns an array
     */
    viz.dataBySeries = function (keys, indexes) {
        return viz.data().filter(function (d, i) {
            var passed = false;

            if (sonic.isSet(keys)) {
                if (sonic.isArray(keys)) {
                    keys.forEach(function (k) {
                        if (sonic.isRegex(k)) {
                            if (k.test(d.key)) {
                                passed = true;
                            }
                        } else if (k === d.key) {
                            passed = true;
                        }
                    });
                } else {
                    if (sonic.isRegex(keys)) {
                        if (keys.test(d.key)) {
                            passed = true;
                        }
                    } else if (keys === d.key) {
                        passed = true;
                    }
                }
            } else if (sonic.isSet(indexes)) {
                if (sonic.isArray(indexes) && indexes.indexOf(i) !== -1) {
                    passed = true;
                } else if (indexes === i) {
                    passed = true;
                }
            } else {
                passed = true;
            }

            return passed;
        });
    };

    /**
     * Get or set the viz width
     *
     * When setting, should probably call update
     */
    viz.width = function (w) {
        return sonic.getOrSet('width', w, p.config, viz);
    };

    /**
     * Get or set the viz height
     *
     * When setting, should probably call update
     */
    viz.height = function (h) {
        return sonic.getOrSet('height', h, p.config, viz);
    };

    /**
     * Get the d3 selection of the svg
     */
    viz.container = function () {
        return p.selection.select('.sonic-viz');
    };

    /**
     * Get the current margins
     *
     * @param {Number} padding value
     * @param {Object} id of component
     */
    viz.margin = function (m, id) {
        var mar = sonic.getOrSet('margin', m, p.config, viz);

        if (sonic.isSet(m)) {
            viz.refreshRegistry(id);
        }

        p.translateBody();

        return mar;
    };

    /**
     * Get/Set current padding values based on params.
     *
     * @param {Object} holds the side and value i.e. {top: 10}
     * @param {Object} id of component
     */
    viz.currentPadding = function (a, id) {
        var auto = sonic.getOrSet('currentPadding', a, p.config, viz);

        if (sonic.isSet(a) && sonic.isSet(id)) {
            viz.refreshRegistry(id);
            p.translateBody();
        }

        return auto;
    };

    /**
     * Get the padding values set by user / default
     * @param {Number} padding value
     */
    viz.padding = function () {
        return p.config.padding;
    };

    viz.mouse = function (container) {
        var m = d3.mouse(container),
            margin = viz.margin(),
            padding = viz.currentPadding();

        return [m[0] - margin.left - padding.left, m[1] - margin.top - padding.top];
    };

    viz.mouse.inBody = function (posArr) {
        return posArr[0] <= viz.body().width() && posArr[0] >= 0 && posArr[1] <= viz.body().height() && posArr[1] >= 0;
    };

    /**
     * Get the d3 selection of the svg body
     */
    viz.body = function () {
        var body = viz.container().select('.sonic-viz-body');

        /**
         * Get the body's width
         */
        body.width = function (w) {
            return viz.width() - p.config.margin.left - p.config.margin.right - p.config.currentPadding.left - p.config.currentPadding.right;
        };

        /**
         * Get the body's height
         */
        body.height = function (h) {
            return viz.height() - p.config.margin.top - p.config.margin.bottom - p.config.currentPadding.top - p.config.currentPadding.bottom;
        };

        return body;
    };

    /**
     * Get or set animation properties of viz
     *
     * If coming back from hidden state, no animation.
     * @todo think this through
     */
    viz.animation = function (a) {
        if (!sonic.isSet(a) && p.hiddenUpdates) {
            return {
                duration: 1000,
                delay: 0
            };
        }
        return sonic.getOrSet('animation', a, p.config, viz);
    };

    /** currently only allowing one zoomer per viz
        should think about breaking it out so we can have
        multiple, but need to think about where to attach zoomer **/
    viz.addZoom = function (id, callbackOpts, xScale, yScale) {
        if (!p.zoom.zoomer) {
            p.zoom.zoomer = d3.behavior.zoom()
                .x(xScale.scale())
                .y(yScale.scale())
                .on('zoomstart', p.zoomStartAction)
                .on('zoom', p.zoomAction)
                .on('zoomend', p.zoomEndAction);

            viz.container().call(p.zoom.zoomer);

            viz.container().selectAll('.sonic-clear-link')
                .text('reset');

            viz.addListeners({
                '.sonic-clear-link': {
                    'click': function () {
                        p.zoom.zoomer.translate([0,0]).scale(1);
                        p.zoomAction();
                    }
                }
            });
        }

        if (p.zoom.zoomer.x() !== xScale.scale()) {
            p.zoom.zoomer.x(xScale.scale());
        }

        if (p.zoom.zoomer.y() !== yScale.scale()) {
            p.zoom.zoomer.y(yScale.scale());
        }

        p.setupZoomCallbacks(id, callbackOpts);

    };

    viz.getZoom = function () {
        return p.zoom;
    };

    p.setupZoomCallbacks = function (id, callbackOpts) {
        sonic.each(callbackOpts, function (event, conf) {
            p.zoom.cbs[event][id] = function () {conf.fn(conf.opts);};
        });
    };
    p.zoomStartAction = function () {
        p.zoom.holdAnimation = sonic.clone(viz.animation());
        viz.animation({
            duration: 0,
            delay: 0
        });
        viz.container().select('.sonic-clear-link')
            .style('display', 'block');
        sonic.each(p.zoom.cbs.zoomstart, function (id, cb) {
            cb();
        });
    };
    p.zoomAction = function () {
        sonic.each(p.zoom.cbs.zoom, function (id, cb) {
            cb();
        });
        viz.find('sonic-axis').forEach(function (a) {a.update();});
    };
    p.zoomEndAction = function () {
        sonic.each(p.zoom.cbs.zoomend, function (id, cb) {
            cb();
        });
        viz.animation(p.zoom.holdAnimation);
    };

    /**
     * Update all components except scales
     * @todo better naming
     */
    viz.refreshRegistry = p.registry.refresh;

    /**
     * Default body click listener
     *
     * @todo this should be configurable (whether it's added
     * or not) and probably in a different class
     */
    viz.onBodyClick = function (closestPoints) {
        viz.container().select('.sonic-clear-link')
            .style('display', 'block');
    };

    /**
     * Default body click clear listener
     *
     * @todo this should be configurable (whether it's added
     * or not) and probably in a different class
     */
    viz.onClearClick = function (closestPoints) {
        viz.container().select('.sonic-clear-link')
            .style('display', 'none');
    };

    /**
     * "Clear" the viz which removes the clear link and
     * calls the handlEvent function for all components who care
     * to listen
     *
     * @todo this should be configurable (whether it's added
     * or not) and probably in a different class
     */
    viz.clear = function () {
        viz.onClearClick();
        p.registry.applyFn('handleEvent', ['.sonic-clear-link', 'click']);
    };

    /**
     * Get tooltip singleton
     */
    viz.tooltipSingleton = function () {
        return p.tooltip;
    };

    /**
     * Get listener singleton
     */
    viz.listenerSingleton = function () {
        return p.listener;
    };

    /**
     * Get component singleton
     */
    viz.componentSingleton = function () {
        return p.registry;
    };

    /**
     * Get the elementId where this viz is contained
     */
    viz.elId = function () {
        return p.elId;
    };

    /**
     * Returns whether the viz current has visible content
     */
    viz.hasVisibleContent = function () {
        return p.registry.visibleContent().length > 0;
    };

    viz.registry = function () {
        return p.registry;
    };

    /**
     * Allows the viz to register the components visible content status
     * @param {sonic.*} component a sonic component that want to register
     * if it has visible content or not
     * @param {boolean} whether the component has visible content
     */
    viz.registerVisibleContent = function (component, isVisible) {
        p.registry.registerVisibleContent(component, isVisible);
        viz.drawNoContentMessage();
    };

    /**
     * Checks if the viz has content. If so we remove the no data message, if
     * not we add the message.
     */
    viz.drawNoContentMessage = function () {
        var noDataMessage = viz.body().selectAll('text.nocontentmessage')
            .data(viz.hasVisibleContent() ? [] : [1]);

        noDataMessage.enter().append('text')
            .classed('nocontentmessage', true)
            .style('text-anchor', 'middle')
            .text(p.config.noContentMessage);

        noDataMessage
            .attr('x', viz.body().width() / 2)
            .attr('y', viz.body().height() / 2);

        noDataMessage.exit().remove();

    };

    /**
     * Translate the viz body based on the padding and margin configs.
     */
    p.translateBody = function () {
        viz.body().attr(
                'transform',
                'translate(' + (p.config.margin.left + p.config.currentPadding.left) + ',' + (p.config.margin.top + p.config.currentPadding.top) + ')'
            );
    };
    /**
     * Initialize this component by setting its element Id & corresponding
     * d3 selection, its data, and its config, then binding the api methods
     * to the viz, and finally instantiating the viz using the constructor.
     */
    p.init = function (args) {
        p.elId = args[0];
        p.selection = d3.select(p.elId);

        if (args[1]) {
            if (sonic.isArray(args[1])) {
                viz.data(args[1], false);
            } else {
                viz.mergeConfig(args[1]);
            }
        }

        if (args[2]) {
            viz.mergeConfig(args[2]);
        }

        if (p.config.tooltip) {
            p.tooltip.mergeConfig(p.config.tooltip);
        }

        if (p.config.height || p.config.width) {
            p.config.sizeMode = 'manual';
        }

        p.bindAPIMethods();
        viz.update();
    };

    /**
     * Add the svg and its interior body with the current data
     */
    p.drawContainer = function (sel) {
        sel.append('svg')
            .classed('sonic-viz', true)
            .append('g')
                .classed('sonic-viz-body', true)
                .data(p.data);
    };

    /**
     * Bind api methods that get described by the various components so
     * that a user can call viz.addBars(), viz.addAxis(), etc.
     *
     * @todo should we namespace api methods somehow? or at least check?
     */
    p.bindAPIMethods = function () {
        p.api.methods().forEach(function (fnName, fn) {
            viz[fnName] = function () {
                var result = fn.apply(
                    this,
                    [viz].concat(sonic.argsToArr(arguments))
                );

                //if api method needs to specifically return something,
                //allow it - otherwise, return viz for chaining
                //note that a method that returns "nothing" needs to return
                //null, not undefined
                if (result !== undefined) {
                    return result;
                }

                return viz;
            };
        });
    };

    /**
     *  Add a link to the viz used as a control for users to clear out
     *  components (however the component defines "clear").  Hidden to start
     *
     * @todo this should be configurable (whether it's added
     * or not) and probably in a different class
     */
    p.addClearLink = function () {
        var text = viz.container().selectAll('.sonic-clear-link')
            .data([1]);

        text.enter().append('text')
            .classed('sonic-clear-link', true)
            .text('clear')
            .style('display', 'none');

        text
            .attr('x', viz.width() - viz.margin().right - 20)
            .attr('y', viz.height() - 10);
    };

    /**
     * Add default listeners to viz
     *
     * Main one is "vizbodywide" hover and click which is used often
     *
     * Other one is clear link click to clear the viz
     *
     * @todo clear-link click should be configurable (whether it's added
     * or not) and probably in a different class
     * @todo a user should be able to call viz.clear(); in some way
     * to clear, instead of having to initiating a 'clear-link' dom click
     */
    p.addDefaultListeners = function () {
        viz.addListeners({
            'vizbodywide': {
                'mousemove': null,
                'click': viz.onBodyClick
            }
        });

        if (p.config.visibleClear === true) {
            viz.addListeners({
                '.sonic-clear-link': {
                    'click': viz.onClearClick
                }
            });
        }

        return viz;
    };

    sonic.augment(viz, p, viz, 'registerable');

    window.addEventListener('resize', function () { viz.update(); });

    //initialize
    p.init(sonic.argsToArr(arguments));

    return viz;
};
