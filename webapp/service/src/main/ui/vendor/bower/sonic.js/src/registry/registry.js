/**
 * Component registry
 *
 * This is used to manage a list of "component" instances that are 
 * registered with a particular viz.  So, component types are "axis", 
 * "line", "bar", etc, and instances of these can be added to a viz instance.
 */
sonic.registry = function () {
    var map = d3.map(), //internal list of current component instances
        visibleContentIdx = []; // index of components with visible content

    /**
     * Constructor
     */
    function registry() {}

    /**
     * Get list of component instances
     */
    registry.components = function () {
        return map;
    };

    /**
     * Add a component instance to this registry, with a type name
     * and the instance
     */
    registry.add = function (type, obj) {
        var id,
            hasId = sonic.isFunction(obj.id) &&
                sonic.isSet(obj.id()); //get id, if instance has id method

        if (!map.has(type)) {
            map.set(type, d3.map());
        }

        if (hasId) {
            id = obj.id();
        } else {
            id = generateId(type);
        }

        //@todo what to do if registered
        if (!map.get(type).has(id)) {
            //if an id setter in obj, automatically set
            if (!hasId && sonic.isFunction(obj.id)) {
                obj.id(id);
            }
            map.get(type).set(id, obj);
            //by default a registered component is said to have content
            //the viz will update this later as the component tries to render
            //content
            if (!sonic.array.contains(visibleContentIdx, id)) {
                visibleContentIdx.push(id);
            }
        }

        return id;
    };

    /**
     * Returns all registered components
     */
    registry.findAll = function () {
        return map.entries();
    };

    /**
     * Find a component by type and key/value params (and return first match)
     *
     * If params var is a string, will assume search by id
     *
     * Returns component instance or null
     *
     * @todo, should probably be able to search without type
     */
    registry.findOne = function (type, params) {
        var matches = registry.find(type, params),
            match = null;

        if (matches[0]) {
            match = matches[0];
        }

        return match;
    };

    /**
     * Find components, by type and key/value params
     *
     * Returns component instance array, or empty array
     *
     * @todo, should probably be able to search without type
     */
    registry.find = function (type, params) {
        var typeReg,
            matches = [],
            match;

        params = params || {};

        if (!map.has(type)) {
            return [];
        }

        typeReg = map.get(type);

        //assume id if string
        if (sonic.isString(params)) {
            match = typeReg.get(params);
            return sonic.isSet(match) ? [typeReg.get(params)] : [];
        }

        //if id
        if (sonic.isSet(params.id)) {
            if (sonic.isString(params.id)) {
                match = typeReg.get(params.id);
                return sonic.isSet(match) ? [match] : [];
            } else {
                return typeReg.entries().map(function (entry) {
                    return entry.value;
                }).filter(function (member) {
                    return params.id.test(member.id());
                });
            }
        }

        map.get(type).forEach(function (id, obj) {
            var match = true,
                p;

            for (p in params) {
                if (params.hasOwnProperty(p)) {
                    if (!sonic.isFunction(obj[p])) {
                        match = false;
                    } else {
                        if (obj[p]() !== params[p]) {
                            match = false;
                        }
                    }
                }
            }

            if (match) {
                matches.push(obj);
            }
        });

        if (matches.length === 0) {
            return [];
        }

        return matches;
    };

    /**
     * Apply a function to each component instance
     */
    registry.applyFn = function (fnName, args) {
        map.forEach(function (type, list) {
            list.forEach(function (id, obj) {
                if (sonic.isFunction(obj[fnName])) {
                    obj[fnName].apply(obj, args);
                }
            });
        });
    };

    /**
     * Update each component instance in the registry by calling 
     * its update function
     *
     * Need to update scales first since components often depend
     * on scales.
     *
     * @todo - should there be a dependency system (so we know which
     * components depend on each other?) - is possibly too complicated - 
     * though, could do simpler version with just dependencies on scales
     */
    registry.update = function () {
        if (map.has('scale')) {
            map.get('scale').forEach(function (id, scale) {
                scale.update();
            });
        }

        map.forEach(function (type, list) {
            if (type === 'scale') { //already updated above
                return;
            }

            list.forEach(function (id, obj) {
                if (sonic.isFunction(obj.update)) {
                    obj.update();
                }
            });
        });
    };

    /**
     * Refresh all components, but skip scales.  Also skip
     * components matching the ignoreId.  This is often used
     * after 1 component updates an underlying scale, and wants
     * that change to propagate to other components that depend on 
     * that scale.
     *
     * @todo this should 1) be combined with update above and/or 2)
     * be done using a reactive scale object that has its own list 
     * of registered callbacks on update
     */
    registry.refresh = function (ignoreId) {
        map.forEach(function (type, list) {
            if (type === 'scale') {
                return;
            }

            list.forEach(function (id, obj) {
                if (id === ignoreId) {
                    return;
                }

                obj.update();
            });
        });
    };

    /**
     * Remove components based on a type and parameters.
     *
     * Deletes all instances of type if no params passed, 
     * or specific id if params = string or params.id exists.
     *
     * @todo combine type into params?
     */
    registry.remove = function (type, params) {
        var typeReg,
            matches = [];

        if (!map.has(type)) {
            return [];
        }

        typeReg = map.get(type);

        if (!sonic.isSet(params)) {
            matches = matches.concat(typeReg.values());
        } else if (sonic.isString(params)) {
            matches.push(typeReg.get(params));
        } else if (sonic.isSet(params.id)) {
            matches.push(typeReg.get(params.id));
        }

        matches.forEach(function (d) {
            d.remove();
            typeReg.remove(d.id());
        });
    };

    /**
     * Returns the visible content index which is an array of component ids
     * that have registered the content as visible
     * @TODO consider making this a getter/setter that allows a complete
     * setting/unsetting of the visibleContentIdx
     */
    registry.visibleContent = function () {
        return visibleContentIdx;
    };

    /**
     * Either adds or removes the component id from the visibleContentIdx
     * based on if it is visible or not
     * @param {sonic.*} component The component to register
     * @param {boolean} whether it has visible content or not
     */
    registry.registerVisibleContent = function (component, isVisible) {
        if (isVisible) {
            sonic.array.add(visibleContentIdx, component.id(), true);
        } else {
            sonic.array.remove(visibleContentIdx, component.id());
        }
    };

    /**
     * Generate a random id to be used for the component id
     */
    function generateId(type) {
        return type + '-' + Math.floor(Math.random() * 10000);
    }

    return registry;
};

/**
 * Add a component to the registry.
 *
 * Expects viz as first parameter (where registry will 
 * be used) and a variable number of other arguments
 */
function sonic_registry_add() {
    var args = sonic.argsToArr(arguments);
    return args[0].componentSingleton().add.apply(null, args.slice(1));
}

/**
 * Finds all registered components
 *
 * Expects viz as first parameter (where registry will
 * be used) and a variable number of other arguments
 */
function sonic_registry_findAll() {
    var args = sonic.argsToArr(arguments);
    return args[0].componentSingleton().findAll.apply(null, args.slice(1));
}

/**
 * Find a component in the registry (and returns first match).
 *
 * Expects viz as first parameter (where registry will 
 * be used) and a variable number of other arguments
 */
function sonic_registry_findOne() {
    var args = sonic.argsToArr(arguments);
    return args[0].componentSingleton().findOne.apply(null, args.slice(1));
}

/**
 * Finds components in the registry (and returns all matches).
 *
 * Expects viz as first parameter (where registry will 
 * be used) and a variable number of other arguments
 */
function sonic_registry_find() {
    var args = sonic.argsToArr(arguments);
    return args[0].componentSingleton().find.apply(null, args.slice(1));
}

/**
 * Removes components in the registry
 *
 * Expects viz as first parameter (where registry will 
 * be used) and a variable number of other arguments
 */
function sonic_registry_remove() {
    var args = sonic.argsToArr(arguments);
    return args[0].componentSingleton().remove.apply(null, args.slice(1));
}

/* Public API Methods */
sonic_api.add('register', sonic_registry_add);
sonic_api.add('findAll', sonic_registry_findAll);
sonic_api.add('findOne', sonic_registry_findOne);
sonic_api.add('find', sonic_registry_find);
sonic_api.add('remove', sonic_registry_remove);
