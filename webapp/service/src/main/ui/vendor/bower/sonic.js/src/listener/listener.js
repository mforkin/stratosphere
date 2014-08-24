/**
 * Listener manager
 *
 * Manage a list of listeners attached to viz selections with callbacks
 *
 * Registry is optional, where the component instances in the registry
 * can attach their own listeners to the broad viz listeners
 *
 * Internal map is of form:
 *
 *     {
 *         '.my-class-selector': {
 *              'mouseover': function (mouse) {  //do something! },
 *              'click': function (mouse) {  //do something! }
 *         },
 *         '.my-other-selector': {
 *              'click': function (mouse) {  //do something! }
 *         }
 *     }
 *
 *  Note: There is a special listener called 'vizbodywide' that is used 
 *  to register 1 listener for the viz body that components can attach to. 
 *  This is generally better than adding individual listeners for each 
 *  component (though that is doable) so that you can guarantee that the listener 
 *  will always get called, since it sits on top of all components.
 *
 *  To do this, need to attach listeners to the svg itself, and then simulate/calculate 
 *  when the mouse has entered/left the viz body since adding a listener to a svg g element
 *  will only add the listener in the space taken up by the g element's children (so, not 
 *  the full g element area)
 *
 * @todo Hovers can be a bit funky since mouseout doesn't always get triggered in javascript.
 * Look into mouseleave code in jquery that tries to solve this, and/or timers.
 */
sonic.listener = function (viz, registry) {
    var map = {}, //internal list of selection => event => callbacks
        mouseOffBody; //is used to manage whether off or on viz body

    /**
     * Constructor
     */
    function listener() {}

    /**
     * Add listeners to this listener manager instance
     *
     * At end of add, call rebind function so that 
     * all the actual d3 listeners have been updated to match
     * what's in this class's internal list of listeners.
     *
     * lConfig should be in same form as the example given in the docs for this class
     */
    listener.add = function (lConfig) {
        sonic.each(lConfig, function (sel, lObj) {
            if (!map[sel]) {
                map[sel] = {};
            }

            sonic.each(lObj, function (ev, eObj) {
                if (!sonic.isSet(eObj) || sonic.isFunction(eObj)) {
                    eObj = {
                        fn: eObj
                    };
                }

                if (!map[sel][ev]) {
                    map[sel][ev] = [];
                }

                eObj.scope = eObj.scope || viz;

                map[sel][ev].push(eObj);
            });
        });

        listener.rebind();
    };

    /**
     * Remove listeners from this listener manager instance
     *
     * lConfig should be in same form as the example given in docs for this 
     * class.  If not set, removes all listeners
     *
     * At end of remove, call rebind function so that 
     * all the actual d3 listeners have been updated to match
     * what's in this class's internal list of listeners.
     *
     * @todo should it remove all listeners if not set? Could be dangerous
     */
    listener.remove = function (lConfig) {
        if (!sonic.isSet(lConfig)) {
            map = {};
        } else {
            sonic.each(lConfig, function (sel, evs) {
                if (evs === 'all') {
                    delete map[sel];
                } else if (map[sel]) {
                    evs.forEach(function (ev) {
                        delete map[sel][ev];
                    });
                }
            });
        }

        listener.rebind();
    };

    /**
     * Takes the list of listeners for this listener manager instance
     * and bind them to actual selections using d3 events.
     *
     * Whenever the listener list changes, this will need to be called 
     * to keep the d3 event listeners in sync with this listener list.
     *
     * If there is a registry instance with this class, any of the
     * components in the registry can listen in on events as they're triggered
     * by implementing a `handleEvent` function in their class.
     */
    listener.rebind = function () {
        var evHandlerFn = 'handleEvent';

        sonic.each(map, function (sel, lObj) {
            sonic.each(lObj, function (ev, cbs) {
                var selection = viz.container();

                //if selection is not the special "vizbodywide" element (see class 
                //docs for details), grab the d3 selection
                if (sel !== 'vizbodywide') {
                    selection = selection.selectAll(sel);
                }

                selection.on(ev, function () {
                    var results = [],
                        transformedEv = ev,
                        mouse = viz.mouse(selection[0][0]),
                        args = arguments;

                    //handle vizbody listeners which need to map
                    //the container wide selection to the vizbody
                    //selection. See class docs for explanation
                    if (sel === 'vizbodywide') {
                        //if in body, transform mouse position from svg container 
                        //positioning to viz.body() positioning
                        if (viz.mouse.inBody(mouse)) {
                            mouseOffBody = false;
                        } else { //call mouseout
                            if (isBodyMouseOut(transformedEv)) {
                                transformedEv = 'mouseout';
                                mouseOffBody = true;
                            } else {
                                return;
                            }
                        }
                    }

                    //if registry is set, loop through components calling 
                    //standard listener callback
                    if (registry) {
                        registry.components().forEach(function (type, list) {
                            list.forEach(function (id, obj) {
                                var res,
                                    evFn = obj[evHandlerFn];
                                if (sonic.isFunction(evFn)) {
                                    //call function with selection, event, and mouse position
                                    res = evFn.apply(obj, [sel, transformedEv, mouse]);

                                    //if something returned, gather and feed into callbacks below
                                    if (sonic.isSet(res)) {
                                        results = results.concat(res);
                                    }
                                }
                            });
                        });
                    }

                    //loop through and apply callbacks, optionally with anything that was returned by
                    //the components that listened in on the event
                    cbs.forEach(function (cb) {
                        if (sonic.isSet(cb) && sonic.isFunction(cb.fn)) {
                            cb.fn.call(cb.scope, results);
                        }
                    });
                });
            });
        });
    };

    /**
     * Is the mouse for this listener manager instance actually off 
     * of the viz body
     *
     * Note that since we have to transform the svg wide event onto the 
     * viz body event, we can't just check mouse position, must check whether 
     * we've already registered as being out
     */
    function isBodyMouseOut(ev) {
        return (ev === 'mousemove' && mouseOffBody === false);
    }

    return listener;
};

/**
 * Add a listener
 */
function sonic_listener_add(v, c) {
    v.listenerSingleton().add(c);
}

/**
 * Remove a listener
 */
function sonic_listener_remove(v, c) {
    v.listenerSingleton().remove(c);
}

/* Public API Methods */
sonic_api.add('addListeners', sonic_listener_add);
sonic_api.add('removeListeners', sonic_listener_remove);
