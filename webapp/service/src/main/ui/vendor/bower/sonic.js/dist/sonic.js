/*!
Sonic.js v0.5.49
Copyright 2014 Commonwealth Computer Research, Inc.
Licensed under the Apache License, Version 2.0 (https://github.com/ccri/sonic.js/blob/master/LICENSE).
*/
(function(){

sonic = {};

/**
 * Pass this function your cmp to augment, private vars and the mixins to include
 */
sonic.augment = function () {
    var args = sonic.argsToArr(arguments),
        cmp = args.shift(),
        p = args.shift(),
        viz = args.shift();
    //for each mixin
    args.forEach(function (mixin) {
        var m = sonic.object.getProp(sonic, mixin)(cmp, p, viz);
        //for each property in the mixin
        sonic.each(m, function (propName, prop) {
            if (sonic.isFunction(prop)) {
                //if property is a fn and we don't have that fn then we get the
                //mixin fn in our scope
                if (!sonic.isSet(sonic.object.getProp(cmp, propName))) {
                    sonic.object.setProp(cmp, propName, function () {
                        return prop.apply(cmp, arguments);
                    });
                //if we have the fn and we didn't specify that we wanted to
                //override the fn, then throw an error b\c due to the conflict
                } else if (!sonic.object.getProp(cmp, propName).override){
                    console.error(
                        new Error(
                            'The fn ' + propName + ' of mixin ' + mixin + 'is already defined. ' +
                            'Please specify override or reconsider the naming of the fn'
                        ).stack
                    );
                }
            } else {
                //if we don't have the property we get it
                //@todo pretty sure this wouldn't work if we tried to update
                //the property from inside the mixin, probably need to think about
                //merging stuff inside the mixin. maybe could put everything in there?
                if (!sonic.isSet(sonic.object.getProp(cmp, propName))) {
                    sonic.object.setProp(cmp, propName, prop);
                } else {
                    sonic.object.merge(prop, sonic.object.getProp(cmp, propName));
                    sonic.object.merge(sonic.object.getProp(cmp, propName), prop);
                }
            }
        });
    });
};

/**
 * Sets override flag on function to true
 */
sonic.override = function (fn) {
    fn.override = true;
    return fn;
};

/**
 * Whether to whether to use the d3 local or utc time scale methods
 */
sonic.timezone = 'UTC';

/**
 * Whether value is something other than undefined or null
 */
sonic.isSet = function (val) {
    return (val !== undefined && val !== null) ? true : false;
};

/*
 * Is Boolean?
 */
sonic.isBoolean = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Boolean]';
};

/*
 * Is Number?
 */
sonic.isNumber = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Number]';
};

/*
 * Is String?
 */
sonic.isString = function (obj) {
    return Object.prototype.toString.call(obj) === '[object String]';
};

/*
 * Is Object?
 */
sonic.isObject = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
};

/**
 * Is Array?
 */
sonic.isArray = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};

/**
 * Is Function?
 */
sonic.isFunction = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Function]';
};

/**
 * Is Date?
 */
sonic.isDate = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Date]';
};

/**
 * Is Regex?
 */
sonic.isRegex = function (obj) {
    return obj instanceof RegExp;
};

/**
 * Is in form of d3.nest? (e.g.is an array and each element is 
 * an object that has key and values property
 *
 * TODO finish implementing
 */
sonic.isNest = function (obj) {
    return (sonic.isArray(obj) && obj.length > 0 &&
        sonic.isSet(obj[0].key) && sonic.isSet(obj[0].values)) ? true : false;
};

/**
 * Get a random number between min and max
 */
sonic.random = function (min, max) {
    return Math.random() * (max - min) + min;
};

/**
 * Get a random integer between min and max
 */
sonic.randomInteger = function (min, max) {
    return Math.round(sonic.random(min, max));
};

/**
 * Execute function if a value is not undefined
 *
 * @param {Function} function to execute
 * @param {Object} val the value to test, if test passes we pass this into the function
 * @return {sonic.utils} returns the utils for chaining
 */
sonic.doIfSet = function (fn, val) {
    if (val !== undefined) {
        fn(val);
    }
};

/**
 *  Gets or sets a value on an object depending on if value is set
 *
 * @todo this should be cleaned up, and maybe moved out of core/core
 *
 * @param {String} k - the configuration parameter to grab
 * @param {Object} v - the value to set the config parameter, if setting
 *
 * @return {Object/sonic.viz} Will return the value if function used as a getter,
 * and the object if used as a setter (unless an optional return object is desired 
 * instead, which is useful for chaining)
 */
sonic.getOrSet = function (k, v, obj, retObj) {
    if (!sonic.isSet(v)) {
        return obj[k];
    }

    if (!sonic.isObject(obj[k]) || !sonic.isObject(v)) {
        obj[k] = v;
    } else {
        sonic.object.merge(obj[k], v);
    }

    if (retObj) {
        return retObj;
    }

    return obj;
};

/**
 * Return a clone of an item.  Can be a primitive 
 * or complex type
 */
sonic.clone = function (item) {
    var i,
        clone,
        key;

    if (!sonic.isSet(item)) {
        return item;
    }

    if (sonic.isDate(item)) {
        return new Date(item.getTime());
    }

    if (sonic.isArray(item)) {
        i = item.length - 1;

        clone = [];

        do {
            clone[i] = sonic.clone(item[i]);
            i = i - 1;
        } while (i >= 0);
    }

    if (sonic.isObject(item)) {
        clone = {};

        sonic.each(item, function (k, v) {
            clone[k] = sonic.clone(v);
        });
    }

    return clone || item;
};

sonic.string = {};

/**
 * Cap first letter of string
 */
sonic.capFirstLetter = function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Checks if a string is numeric
 *
 * @param {boolean} integersOnly means only allow integers
 *
 */
sonic.string.isNumeric = function (str, integersOnly) {
    //regex to allow numbers with a decimal, note 12. is not allowed but .12 is
    //allowed
    var regex = '^[0-9]*[.]{0,1}[0-9]+$';
    if (integersOnly) {
        //regex matching an integer
        regex = '^[0-9]+$';
    }

    return RegExp(regex).test(str);
};

sonic.array = {};

/**
 * Cross browser indexOf function
 */
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (obj, start) {
        var i, j;

        for (i = (start || 0), j = this.length; i < j; i += 1) {
            if (this[i] === obj) { return i; }
        }

        return -1;
    };
}

/**
 * Converts a list of arguments to an array
 */
sonic.argsToArr = function () {
    var args = arguments;
    return Array.prototype.slice.call(args[0], 0);
};

/**
 * Sort a list by a property
 * We accept deep object sorting, so you may pass 'path.to.prop' to
 * sort by nested object elements
 * Note: That means that the elements being sorted must 
 * be objects.
 * @TODO think about error handling for if an object doesn't contain
 * the specified path
 */
sonic.sortByProp = function (prop, desc) {
    return function (a, b) {
        var propA = sonic.object.getProp(a, prop),
            propB = sonic.object.getProp(b, prop);

        if (sonic.isDate(propA)) {
            propA = propA.getTime();
        }

        if (sonic.isDate(propB)) {
            propB = propB.getTime();
        }

        if (propA < propB) {
            return desc ? 1 : -1;
        }

        if (propA > propB) {
            return desc ? -1 : 1;
        }

        return 0;
    };
};

/**
 * Get the max length of the second level of a 2-dimensional arr, 
 * where the second level is either an array or a object in nest 
 * format ({key: foo, values: [..,..,..]})
 */
sonic.array.maxLength = function (arr) {
    return arr.reduce(function (prev, curr) {
        return Math.max(
            prev,
            sonic.isArray(curr) ? curr.length : curr.values.length
        );
    }, 0);
};

/**
 * Get a random element in the array
 */
sonic.array.random = function (arr) {
    if (!sonic.isArray(arr) || arr.length === 0) {
        return;
    }

    return arr[sonic.randomInteger(0, arr.length - 1)];
};

/**
 * Removes an item from an array
 * @TODO allow multiple items or a function to determine which items to remove
 * @TODO think about unique objects impl
 */
sonic.array.remove = function (arr, item) {
    var idx = arr.indexOf(item);
    if (idx >= 0) {
        arr.splice(idx, 1);
    }
};

/**
 * Adds an item to an array
 * @TODO allow an index to be specified, think about unique objects impl
 */
sonic.array.add = function (arr, item, unique) {
    if (unique && arr.indexOf(item) >= 0) {
        return;
    }

    arr.push(item);
};

/**
 * Does the array contain the specified value.
 * 
 * Useful when you're not sure whether you're dealing 
 * with dates
 */
sonic.array.contains = function (arr, val) {
    var contains;
    if (!arr) {
        return false;
    }
    if (sonic.isDate(val)) {
        contains = arr.some(function (v) {
            return sonic.isDate(v) && v.getTime() === val.getTime();
        });
    } else {
        contains = arr.indexOf(val) !== -1;
    }

    return contains;
};

/**
 * Plucks the value of a property from each item in the array
 */
sonic.array.pluck = function (arr, propPath) {
    return arr.map(function (d) {
        return sonic.object.getProp(d, propPath);
    });
};

/**
 * Binary search an already sorted array, and return index 
 * of matching element, or null if not found
 */
sonic.array.binarySearch = function (arr, comparator) {
    var low = 0, high = arr.length - 1,
        i, comparison;

    while (low <= high) {
        i = Math.floor((low + high) / 2);
        comparison = comparator(arr[i]);
        if (comparison < 0) {
            low = i + 1;
            continue;
        }
        if (comparison > 0) {
            high = i - 1;
            continue;
        }
        return i;
    }
    return null;
};

/**
 * Finds elements of array that match the params
 *
 * params is an object of k => v, where k is the 
 * property or property path of object within array, 
 * and v is either a value or a function that evaluates 
 * to a value
 *
 * Note: Slow for big arrays
 *
 * @todo support bare arrays
 */
sonic.array.find = function (arr, params) {
    return arr.filter(function (d) {
        var passed = true;

        sonic.each(params, function (k, v) {
            var currVal = sonic.object.getProp(d, k),
                compareVal = v;

            if (sonic.isFunction(v)) {
                compareVal = v();
            }

            if (currVal !== compareVal) {
                passed = false;
                return false;
            }
        });

        return passed;
    });
};

/**
 * Finds the first element in the arr that matches the params
 *
 * params is an object of k => v, where k is the 
 * property or property path of object within array, 
 * and v is either a value or a function that evaluates 
 * to a value
 *
 * Note: Slow for big arrays
 */
sonic.array.findOne = function (arr, params) {
    var all = sonic.array.find(arr, params);

    if (all.length === 0) {
        return null;
    }

    return all[0];
};

/**
 * Retrieve unique items from an array(s)
 */
sonic.array.unique = function (arrs) {
    //check if a simple array - make it into multi-dimensional for 
    //easier handling below
    if (sonic.isArray(arrs) && !sonic.isArray(arrs[0])) {
        arrs = [arrs];
    }

    return arrs.reduce(function (prev, curr) {
        return prev.concat(curr.filter(function (v) {
            return !sonic.array.contains(prev, v);
        }));
    }, []);
};

sonic.object = {};

/**
 * Apply a function to elements in an object.  Use built in 
 * array.forEach if using an array.
 *
 * If a function returns false, will break out of the loop
 *
 * @todo remove this when we make use of d3's map object
 *
 * @param {Object} obj - object to loop over
 * @param {Function} fn - element-wise executor. Accepts the index/key, dataElement
 * @param {scope} scope in which to execute the function.
 */
sonic.each = function (obj, fn, scope) {
    var i,
        index,
        result;

    for (i in obj) {
        if (obj.hasOwnProperty(i)) {
            result = fn.call(
                scope || obj[i],
                i,
                obj[i]
            );

            if (result === false) {
                return;
            }
        }
    }
};

sonic.object.keys = function (obj) {
    var i, keys = [];
    for (i in obj) {
        if (obj.hasOwnProperty(i)) {
            keys.push(i);
        }
    }
    return keys;
};

sonic.object.values = function (obj) {
    var i, values = [];
    for (i in obj) {
        if (obj.hasOwnProperty(i)) {
            values.push(obj[i]);
        }
    }
    return values;
};

/**
 * Recursively merge one object into another object
 */
sonic.object.merge = function (base, obj) {
    var i;

    if (obj) {
        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                if (
                    !sonic.isObject(base[i]) ||
                        !sonic.isObject(obj[i])
                ) {
                    base[i] = obj[i];
                } else {
                    sonic.object.merge(base[i], obj[i]);
                }
            }
        }
    }
    return base;
};

/**
 * Merges two objects together so they have the same properties, base objects
 * properties will be overridden by the obj objects properties if there
 * are conflicting keys. Note that they remain two separate objects
 */
sonic.object.equalize = function (base, obj) {
    sonic.object.merge(obj, sonic.object.merge(base, obj));
};

/**
 * Gets a property from the object, can be a nested ("deep") property
 * Example sonic.object.getProp({a: {b: 1}}, 'a.b') will return 1
 */
sonic.object.getProp = function (obj, propPath) {
    var p = obj;
    propPath.split('.').forEach(function (pathPiece) {
        p = p[pathPiece];
    });
    return p;
};

sonic.object.setProp = function (obj, propPath, val) {
    var p = obj,
        path = propPath.split('.'),
        settingProp = path.pop();

    path.forEach(function (pathPiece) {
        p = p[pathPiece];
        if (!sonic.isSet(p)) {
            p[pathPiece] = {};
            p = p[pathPiece];
        }
    });

    p[settingProp] = val;

    return obj;
};

sonic.nest = function (inData) {

    function nest() {
        var data = [];
        if (sonic.isNest(inData)) {
            data = inData;
        } else if (sonic.isObject(inData)) {
            data = fromObject(inData);
        } else if (sonic.isArray(inData)) {
            data = fromArray(inData);
        }

        //@todo throw error
        if (!sonic.isSet(data)) {
            return [];
        }

        return data;
    }

    /**
     * Converts an object into a nest, so long as the object 
     * is of the form key: [values]
     */
    function fromObject(d) {
        return d3.entries(d);
    }

    /**
     * Converts an array into a "nest".  Can accept
     * single or multi-dimensional arrays
     *
     * @todo should this be part of some sort
     * of nest constructor instead?
     */
    function fromArray(d) {
        //if single dimensional array, convert to 
        //multi-dimensional for ease of conversion
        //to nest format
        if (sonic.isArray(d) && !sonic.isArray(d[0])) {
            d = [d];
        }

        return d.map(function (val, idx) {
            return {
                key: idx,
                values: val
            };
        });
    }

    return nest();
};

/*
 * Find a record in a nest by its key
 */
sonic.nest.findByKey = function (nest, key) {
    var val;
    nest.forEach(function (n) {
        if (n.key === key) {
            val = n;
        }
    });
    return val;
};

sonic.colors = {};

/**
 * Returns a function that maps keys to color values in the order it sees the
 * keys. Once you exhaust the colorlist we loop around it.
 * @param {Array[String]} specificColors pass colors to override the default
 * color settings
 * @param {d3.map} partialMap you may pass in a partial map to preset keys to specific
 * values
 */
sonic.colors.colorMap = function (specificColors, partialMap) {
    var curIdx = 0,
        colorMap = partialMap || d3.map(),
        colorList = specificColors || ['#EE0000', '#EE5500', '#DDDD00',
        '#00CC00', '#0000EE', '#770077', '#DD00DD', '#880000', '#FF3300',
        '#CC9900', '#009999', '#006600', '#00008F', '#440044', '#FF0066'],
        cm;

    colorMap.values().forEach(function (color) {
        var idx = colorList.indexOf(color);
        if (idx >= 0) {
            colorList.splice(idx, 1);
            colorList.push(color);
        }
    });

    cm = function (key) {
        if (!colorMap.has(key)) {
            colorMap.set(key, colorList[curIdx % colorList.length]);
            curIdx = (curIdx + 1) % colorList.length;
        }
        return colorMap.get(key);
    };

    cm.remove = function (key) {
        var color = colorMap.get(key),
            idx = colorList.indexOf(color);
        colorList.splice(idx, 1);
        if (curIdx > idx) {
            curIdx = curIdx - 1;
        }
        colorList.splice(curIdx, 0, color);

    };

    return cm;
};

/**
 * Generates a discrete/continuous color gradient based on user input.
 * @param{array[colors]} colorSteps The steps of color transitions
 * @param{array[values]} valSteps The values to associate with the colors
 * @param{int} steps The number of steps to generate in between values
 *
 * An example would be:
 * colors = sonic.colors.generateGradient(['red', 'white', 'green'], [-1, 0, 1], 5)
 * this would generate a gradient from red to white with 5 color bins, and
 * white to green with five color bins. Specifying no bins gives you a continuous
 * color range
 * So colors.getColor(-0.5) would give you the color in between red and white
 * colors.getColor(.5) would give you the color in between white and green
 */
sonic.colors.generateGradient = function (colorSteps, valSteps, steps) {
    /**
     * Here we adjust the valueSteps if they don't equal the color steps
     */
    if (valSteps.length !== colorSteps.length) {
        var stepSize = (valSteps[1] - valSteps[0]) / (colorSteps.length - 1);
        valSteps = d3.range(valSteps[0], valSteps[1] + stepSize, stepSize);
    }

    if (steps) {
        return sonic.colors.generateDiscreteColorGradient.call(this, colorSteps, valSteps, steps);
    } else {
        return sonic.colors.generateContinuousColorGradient.call(this, colorSteps, valSteps);
    }
};

/**
 * Allows you to specific steps that bin the colors based on step size
 */
sonic.colors.generateDiscreteColorGradient = function (colorSteps, valSteps, steps) {
    var colorMap = d3.map(),
        prevColor = d3.rgb(colorSteps.shift()),
        prevVal = valSteps.shift();

    //creates color bins
    valSteps.forEach(function (v, i) {
        var stepSize = (v - prevVal) / steps,
            color = d3.rgb(colorSteps[i]),
            rdiff = (color.r - prevColor.r) / steps,
            gdiff = (color.g - prevColor.g) / steps,
            bdiff = (color.b - prevColor.b) / steps;

        d3.range(prevVal, v + (i === valSteps.length - 1 ? stepSize : 0), stepSize).forEach(function (step, i) {
            colorMap.set(step, d3.rgb(prevColor.r + rdiff * i, prevColor.g + gdiff * i, prevColor.b + bdiff * i));
        });
        prevColor = color;
        prevVal = v;
    });

    return {
        /**
         * Grabs the color bin closest to the value
         */
        getColor: function (val) {
            var k;
            //determines bin
            colorMap.keys().some(function (key) {
                var floatKey = parseFloat(key);
                if (!sonic.isSet(k) || val > floatKey) {
                    k = floatKey;
                    return false;
                }
                if (Math.abs(val - floatKey) < Math.abs(val - k)) {
                    k = floatKey;
                }
                return true;

            });
            //gets color at bin k
            return colorMap.get(k);
        }
    };
};

/**
 * Generates a continues color gradient
 */
sonic.colors.generateContinuousColorGradient = function (colorSteps, valSteps) {
    /**
     * Function to find which color range we are in based on the value
     */
    function findIdxRange (val) {
        var pos = d3.bisect(valSteps, val);
        if (pos === valSteps.length) {
            pos = pos - 1;
        }
        return [pos - 1, pos];
    }

    return {
        //gets color based on percentage difference
        getColor: function (val) {
            var idxRange = findIdxRange(val),
                startColor = d3.rgb(colorSteps[idxRange[0]]),
                endColor = d3.rgb(colorSteps[idxRange[1]]),
                rdiff = (endColor.r - startColor.r),
                gdiff = (endColor.g - startColor.g),
                bdiff = (endColor.b - startColor.b),
                percentChange = (val - valSteps[idxRange[0]]) / (valSteps[idxRange[1]] - valSteps[idxRange[0]]);
            return d3.rgb(startColor.r + rdiff * percentChange, startColor.g + gdiff * percentChange, startColor.b + bdiff * percentChange);
        }
    };
};
sonic.registerable = function (cmp, p, viz) {
    var registerable = {},
        private = {
            data: [],
            selection: null,
            config: {
                id: null
            }
        };

    /**
     * A getter/setter for the id
     */
    registerable.id = function (val) {
        return sonic.getOrSet('id', val, p.config, cmp);
    };

    /**
     * A function to merge configuration into our public vars. This allows
     * users to set and adjust configuration options.
     * @TODO investigate the need to also merge this into the initial config
     * variable in components. This would require attaching the config variable
     * to the component to gain access to it here.
     */
    registerable.mergeConfig = function (conf) {
        sonic.object.merge(p.config, conf);
    };

    /**
     * Updates a component by applying the components main function to the
     * selection. If new config has been passed, it is merged in.
     */
    registerable.update = function (c) {
        var opts = {
            update: true
        };

        if (sonic.isSet(c)) {
            if (c.type !== p.config.type) {
                opts.from = c.type;
            }

            registerable.mergeConfig(c);
        }

        p.selection.call(cmp, opts);
    };

    /**
     * Removes a component by applying the components main function to the
     * selection with the remove flag set to true
     */
    registerable.remove = function () {
        p.selection.call(cmp, {remove: true});
    };

    /**
     * Checks whether the component has content by inspecting the amount
     * of data it currently has.
     */
    registerable.hasContent = function () {
        return p.data.length > 0;
    };

    sonic.object.equalize(private, p);

    return registerable;
};
sonic.listenable = function (cmp, p, viz) {
    var listenable = {},
        private = {
            config: {}
        };

    /**
     * Handles events fired by the viz and calls the mixers appropriate handler
     * @TODO provide ability to extend this class or maybe better is to just
     * add and else to call a custom handler
     */
    listenable.handleEvent = function (sel, ev, mouse) {
        var result;

        if (sel === 'vizbodywide') {
            if (ev === 'mousemove') {
                result = p.onVizMouseMove ? p.onVizMouseMove(mouse) : null;
            } else if (ev === 'mouseout') {
                result = p.onVizMouseMove ? p.onVizMouseMove() : null;
            } else if (ev === 'click') {
                result = p.onVizClick ? p.onVizClick(mouse) : null;
            }
        } else if (sel === '.clear-link' && ev === 'click') {
            result = p.onVizClick ? p.onVizClick() : null;
        }

        return result;
    };

    /**
     * Checks if there were any closest points or a mouse on the mouse move
     * if so it tells the viz to update the tooltip appropriately
     * NOTE this function MUST be defined on the private variable and fn content
     * should reference p
     */
    private.updateTooltips = function (mouse, cps) {
        var renderFn = p.renderTooltips;

        if (p.config.tooltip && p.config.tooltip.renderFn) {
            renderFn = p.config.tooltip.renderFn;
        }

        if (p.config.tooltip) {
            if (mouse && cps && cps.length > 0) {
                p.config.tooltip.closestPoints = cps;
                p.config.tooltip.content = renderFn(cps, mouse);
                p.config.tooltip.associatedId = cmp.id();
                p.config.tooltip.mouse = mouse;

                viz.showTooltip(p.config.tooltip);
            } else {
                viz.hideTooltip(p.config.tooltip);
            }
        }
    };

    sonic.object.equalize(private, p);

    return listenable;
};
var sonic_api = (function sonic_api() {
    var map = d3.map(); //internal list of api methods

    /**
     * Constructor
     */
    function api() {}

    /* Get list of api methods */
    api.methods = function () {
        return map;
    };

    /**
     * Add new method to list of methods
     *
     * @todo check if already exists and throw error if so
     */
    api.add = function (fnName, callback) {
        map.set(fnName, callback);
    };

    /**
     * Remove method from list of methods
     */
    api.remove = function (fnName) {
        map.remove(fnName);
    };

    return api;
}());

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

sonic.svg = function () {};

sonic.svg.height = function (selection) {
    return selection[0][0].getBoundingClientRect().height ||
        parseInt(selection[0][0].getAttribute('height'), 10);
};

sonic.svg.width = function (selection) {
    return selection[0][0].getBoundingClientRect().width ||
        parseInt(selection[0][0].getAttribute('width'), 10);
};

/**
* Given an element, will parse class string attribute in order to
* determine whether it has a particular class.
*
* @param {d3.selection} elem
* @param {String}  cls
* @return {Boolean}
*/
sonic.svg.hasClass = function (elem, cls) {
    var i,
        found = false,
        classes;

    classes = elem.getAttribute('class');

    if (classes) {
        classes = classes.split(' ');

        for (i = 0; i < classes.length; i += 1) {
            if (classes[i] === cls) {
                found = true;
                break;
            }
        }
    }

    return found;
};

sonic.currency = {};

sonic.currency.format = function (d, opts) {
    var unit,
        format = ',';

    opts = opts || {};

    if (opts.decimals === undefined) {
        opts.decimals = 2;
    }

    if (d >= 1000000000) {
        unit = 'B';
        d = d / 1000000000;
    } else if (d >= 1000000) {
        unit = 'M';
        d = d / 1000000;
    } else if (d >= 1000) {
        unit = 'K';
        d = d / 1000;
    }

    if (opts.decimals !== undefined) {
        format = format + '.' + opts.decimals + 'f';
    }

    format = d3.format(format);

    return (opts.excludeDollar ? '' : '$') + format(d) + (unit || '');
};

sonic.geom = {};

sonic.geom.pythagorize = function (a, b) {
    return Math.sqrt(a * a + b * b);
};

sonic.scale = {};

/**
 * Compute the domain (min/max) for a set of data (in nest form)
 *
 * @todo this should be able to take in seriesKeys/seriesIndexes config
 * and only use the appropiate series in computing the domain
 */
function sonic_scale_compute_base_domain(data, c) {
    var domain = [];

    data.forEach(function (series) {
        var td;

        if (c.series && c.series.indexOf(series.key) === -1) {
            return;
        }

        if (!sonic.isArray(series.values) || series.values.length === 0) {
            return;
        }

        td = d3.extent(series.values, function (d) {
            return d[c.dataKey];
        });

        if (sonic.isSet(td[0])) {
            if (!sonic.isSet(domain[0])) {
                domain[0] = td[0];
            } else {
                domain[0] = Math.min(td[0], domain[0]);
            }
        }

        if (sonic.isSet(td[1])) {
            if (!sonic.isSet(domain[1])) {
                domain[1] = td[1];
            } else {
                domain[1] = Math.max(td[1], domain[1]);
            }
        }
    });

    if (sonic.isSet(c.min) && c.min !== 'none') {
        domain[0] = c.min;
    }

    if (sonic.isSet(c.max)) {
        domain[1] = c.max;
    }

    return domain;
}

/**
 * Computes the pixel range for the scale. Auto-accounts for axis positioning
 *
 * @param {Object} scaleConfig the config passed when creating the axis
 */
function sonic_scale_compute_range(viz, pos, inRange) {
    var outRange;

    if (sonic.isArray(inRange)) {
        outRange = inRange.map(function (d) {
            var out = d,
                proportion;

            if (sonic.isString(d) || (sonic.isNumber(d) && d <= 1)) {
                if (sonic.isString(d) && d.match(/%/)) {
                    proportion = parseInt(d.replace(/%/, ''), 10) / 100;
                }

                if (sonic.isNumber(d)) {
                    proportion = d;
                }

                if (pos === 'left' || pos === 'right') {
                    out = proportion * viz.body().height();
                } else {
                    out = proportion * viz.body().width();
                }
            }

            return out;
        });

        // Side Y-Axis's need to reverse the range order due to axis orientation
        if (pos === 'left' || pos === 'right') {
            outRange = d3.permute(outRange, [1, 0]);
        }
    } else {
        if (pos === 'left' || pos === 'right') {
            outRange = [viz.body().height(), 0];
        } else {
            outRange = [0, viz.body().width()];
        }
    }

    return outRange;
}

/**
 * Get the extent of the range
 */
function sonic_scale_range_extent(scale) {
    return Math.abs(scale.rangeMax() - scale.rangeMin());
}

sonic_scale_add = function (v, c) {
    sonic.scale[c.type](v, c);
};

sonic_scale_add_linear = function (v, c) {
    sonic_scale_add(v, sonic.object.merge(
        c,
        { type: 'linear' }
    ));
};

sonic_scale_add_time = function (v, c) {
    sonic_scale_add(v, sonic.object.merge(
        c,
        { type: 'linear' }
    ));
};

sonic_scale_add_ordinal = function (v, c) {
    sonic_scale_add(v, sonic.object.merge(
        c,
        { type: 'linear' }
    ));
};

sonic_scale_update = function (v, p, c) {
    v.find('scale', p).forEach(function (d) {
        d.mergeConfig(c);
        d.update();
    });
};

sonic_scale_remove = function (v, p, c) {
    v.remove('scale', p);
};

sonic_api.add('addScale', sonic_scale_add);
sonic_api.add('addLinearScale', sonic_scale_add_linear);
sonic_api.add('addOrdinalScale', sonic_scale_add_ordinal);
sonic_api.add('addTimeScale', sonic_scale_add_time);
sonic_api.add('updateScale', sonic_scale_update);
sonic_api.add('removeScale', sonic_scale_remove);

sonic.scale.linear = function (viz, initialConfig) {
    var p = {
        d3Scale: null, //underlying d3 scale
        config: {
            /** 
             *  Unique id for this set of bars
             *  Note: A unique id will be generated by framework - this is 
             *  just useful for a way to get the bars by an id that you know
             */
            id: null,
            /**
             * The field that each data point uses for its scale value
             */
            dataKey: null,
            /**
             * The position of the scale (left, right, top, bottom) used 
             * to determine how to draw the range
             */
            pos: null,
            /**
             * Padding to add to scale as a percentage
             */
            pad: {},
            /**
             * The piece of the range to use to draw the scale within.  By 
             * default, will assume the full viz body height/width (depending 
             * on position), but this can be overridden.  For example, [0, .25]
             * would take up a quarter of viz body, along whichever 
             * edge the axis lies, [.25, .75] would take up middle 50%, etc.
             */
            range: null,
            /**
             * Minimum range the domain will span
             */
            minDomainRange: null
        }
    };

    /**
     * Scale constructor generates and returns a d3 scale
     */
    function scale() {
        p.d3Scale = d3.scale.linear()
            .domain(p.computeDomain());

        p.d3Scale.range(p.computeRange());
    }

    /** Update this scale instance */
    scale.update = sonic.override(function () {
        scale();
    });

    /**
     * Getter for underlying scale
     */
    scale.scale = function () {
        return p.d3Scale;
    };

    /**
     * Getter/setter for domain (e.g. [minVal, maxVal])
     *
     * setToMax, if this fn used as a setter, will broaden the 
     * existing domain based on both old and new domain, rather 
     * than just using the new one wholesale
     */
    scale.domain = function (domain, setToMax) {
        if (!sonic.isSet(domain)) {
            return p.d3Scale.domain();
        }

        if (setToMax) {
            p.d3Scale.domain(d3.extent(p.d3Scale.domain().concat(domain)));
        } else {
            p.d3Scale.domain(domain);
        }
    };

    scale.resetDomain = function () {
        scale.domain(p.computeDomain());
    };

    /**
     * Getter/setter for the domain min
     */
    scale.domainMin = function (min) {
        var preMin,
            newMin = min;
        if (!sonic.isSet(min)) {
            return p.d3Scale.domain()[0];
        }

        if (!sonic.isSet(p.config.min)) {
            if (p.config.pad.min) {
                preMin = p.d3Scale.domain()[0];
                newMin = min - (p.d3Scale.domain()[1] - min) * p.config.pad.min;
                if (p.config.adjustNearZero && preMin * newMin <= 0) {
                    newMin = 0;
                }
            }
            p.d3Scale.domain([newMin, p.d3Scale.domain()[1]]);
        }
    };

    /**
     * Getter/setter for the domain max
     */
    scale.domainMax = function (max) {
        var preMax,
            newMax = max;
        if (!sonic.isSet(max)) {
            return p.d3Scale.domain()[1];
        }

        if (!sonic.isSet(p.config.max)) {
            if (p.config.pad.max) {
                preMax = p.d3Scale.domain()[1];
                newMax = max + (max - p.d3Scale.domain()[0]) * p.config.pad.max;
                if (p.config.adjustNearZero && preMax * newMax <= 0) {
                    newMax = 0;
                }
            }
            p.d3Scale.domain([p.d3Scale.domain()[0], newMax]);
        }
    };

    /**
     * Getter for the domain extend
     */
    scale.domainExtent = function () {
        return p.d3Scale.domain()[1] - p.d3Scale.domain()[0];
    };

    /**
     * Find the nearest value to the point based in, based on the
     * data also passed in.
     *
     * This happens here because the scale knows the data key, and also
     * how to traverse the domain
     */
    scale.nearest = function (pnt, dat) {
        var nearest,
            val = pnt[p.config.dataKey];

        sonic.each(dat, function (k, v) {
            var currDist;

            currDist = Math.abs(v[p.config.dataKey] - val);

            if (!sonic.isSet(nearest)) {
                nearest = {};
            }

            if (!sonic.isSet(nearest.dist) || currDist < nearest.dist) {
                nearest.point = v;
                nearest.dist = currDist;

                if (currDist === 0) {
                    return false;
                }
            }
        });

        return nearest;
    };

    /**
     * Sort the values passed in, based on the data key
     */
    scale.sort = function (vals) {
        return vals.sort(sonic.sortByProp(p.config.dataKey));
    };

    /**
     * Getter for the range inputs
     */
    scale.rangeInputs = function () {
        return p.config.range;
    };

    /**
     * When updating scale in axis, will direct code
     * to scale.range. This function differs in each scale type
     */
    scale.resetScale = function (range) {
        return this.range(range);
    };

    /**
     * Getter/setter for the range itself
     */
    scale.range = function (range) {
        if (!sonic.isSet(range)) {
            return p.d3Scale.range();
        }

        p.config.range = range;
        p.d3Scale.range(p.computeRange());

        return scale;
    };

    /**
     * Getter for the range extent
     */
    scale.rangeExtent = function () {
        return sonic_scale_range_extent(scale);
    };

    /**
     * Getter for the range min
     */
    scale.rangeMin = function () {
        return d3.min(p.d3Scale.range());
    };

    /**
     * Getter for the range max
     */
    scale.rangeMax = function () {
        return d3.max(p.d3Scale.range());
    };

    /**
     * Getter for the position along the scale for 
     * the passed in value
     */
    scale.position = function (val) {
        return p.d3Scale(val);
    };

    /**
     * Getter for the data key
     */
    scale.dataKey = function () {
        return p.config.dataKey;
    };

    /**
     * Getter for the scale type
     */
    scale.type = function () {
        return 'linear';
    };

    /**
     * Compute the data domain for this scale.  Use the base scale domain generator, then 
     * do linear scale related checks/adjustments
     *
     * @todo some of these checks, like same domain min/max and config need to be rethought
     */
    p.computeDomain = function () {
        var domain,
            preDomain = {}, //used to keep track of original domain before changing
            offset,
            domainDelta;

        domain = sonic_scale_compute_base_domain(viz.data(), p.config);

        if (domain.length === 0) {
            return [0, 1];
        }

        //if domain min/max = the same, add a bit of offset using 10% of the value
        if (domain[0] === domain[1]) {
            offset = domain[0] * 0.1 < 5 ? 5 : domain[0] * 0.1;
            domain[1] = domain[1] + offset;
        }

        /** If padding desired, adjust the domain accordingly */
        if (p.config.pad) {
            if (p.config.pad.max) {
                preDomain.max = domain[1];
                domain[1] = domain[1] + (domain[1] - domain[0]) * p.config.pad.max;
                if (p.config.adjustNearZero && preDomain.max * domain[1] <= 0) {
                    domain[1] = 0;
                }
            }
            if (p.config.pad.min) {
                preDomain.min = domain[0];
                domain[0] = domain[0] - (domain[1] - domain[0]) * p.config.pad.min;
                if (p.config.adjustNearZero && preDomain.min * domain[0] <= 0) {
                    domain[0] = 0;
                }
            }
        }

        if (p.config.minDomainRange && (domain[1] - domain[0]) < p.config.minDomainRange) {
            domainDelta = Math.ceil((p.config.minDomainRange - (domain[1] - domain[0])) / 2);
            preDomain.min = domain[0];
            preDomain.max = domain[1];
            domain[0] = domain[0] - domainDelta;
            if (p.config.adjustNearZero && preDomain.min * domain[0] <= 0) {
                domain[0] = 0;
                domain[1] = domain[1] + domainDelta;
            }
            domain[1] = domain[1] + domainDelta;
            if (p.config.adjustNearZero && preDomain.max * domain[1] <= 0) {
                domain[1] = 0;
                domain[0] = domain[0] - domainDelta;
            }
        }

        return domain;
    };

    /**
     * Use the base scale fn to generate the pixel range to show scale within
     */
    p.computeRange = function () {
        return sonic_scale_compute_range(
            viz,
            p.config.pos,
            p.config.range
        );
    };

    sonic.augment(scale, p, viz, 'registerable');
    //merge config
    scale.mergeConfig(initialConfig);

    scale();

    viz.register('scale', scale);

    return scale;
};

sonic.scale.ordinal = function (viz, initialConfig) {
    var p = {
        d3Scale: null, //underlying d3 scale
        config: {
            /** 
             *  Unique id for this set of bars
             *  Note: A unique id will be generated by framework - this is 
             *  just useful for a way to get the bars by an id that you know
             */
            id: null,
            /**
             * The field that each data point uses for its scale value
             */
            dataKey: null,
            /**
             * The position of the scale (left, right, top, bottom) used 
             * to determine how to draw the range
             */
            pos: null,
            /**
             * The piece of the range to use to draw the scale within.  By 
             * default, will assume the full viz body height/width (depending 
             * on position), but this can be overridden.  For example, [0, .25]
             * would take up a quarter of viz body, along whichever 
             * edge the axis lies, [.25, .75] would take up middle 50%, etc.
             */
            range: null,
            ticks: {
                /**
                 * fn to sort the domain values
                 */
                sort: function (a, b) {
                    if (a < b) {
                        return -1;
                    } else if (a > b) {
                        return 1;
                    }
                    return 0;
                }
            }
        }
    };


    /**
     * Scale constructor generates and returns a d3 scale
     */
    function scale(sel) {
        p.d3Scale = d3.scale.ordinal()
            .domain(p.computeDomain())
            .rangeBands(p.computeRange());
    }

    /** Update this scale instance */
    scale.update = sonic.override(function () {
        scale();
    });

    /**
     * Getter for underlying scale
     */
    scale.scale = function () {
        return p.d3Scale;
    };

    /**
     * When updating scale in axis, will direct code
     * to scale.rangeBands. This function differs in each scale type
     */
    scale.resetScale = function (range) {
        return this.rangeBands(range);
    };

    /**
     * Getter/Setter for the range
     */
    scale.rangeBands = function (range) {
        if (!sonic.isSet(range)) {
            return p.d3Scale.range();
        }

        p.config.range = range;
        p.d3Scale.rangeBands(p.computeRange());

        return scale;
    };

    /**
     * Getter for the range extent
     */
    scale.rangeExtent = function () {
        return sonic_scale_range_extent(scale);
    };

    /**
     * Getter for the range min
     */
    scale.rangeMin = function () {
        return d3.min(p.d3Scale.range());
    };

    /**
     * Getter for the range max
     */
    scale.rangeMax = function () {
        return d3.max(p.d3Scale.range()) + scale.rangeBand();
    };

    /**
     * Getter for the range band size
     */
    scale.rangeBand = function () {
        return p.d3Scale.rangeBand();
    };

    /**
     * Getter for the position along the scale for 
     * the passed in value
     *
     * If align is not passed, returns the d3 value (which 
     * is beginning of rangeband).  If center, returns the middle 
     * and if max, returns the end
     */
    scale.position = function (val, align) {
        var pos = p.d3Scale(val);

        if (align === 'center' || align === 'bin') {
            pos = pos + p.d3Scale.rangeBand() / 2;
        } else if (align === 'max') {
            pos = pos + p.d3Scale.rangeBand();
        }

        return pos;
    };

    /** Getter for the data key */
    scale.dataKey = function () {
        return p.config.dataKey;
    };

    /** Getter for the scale type */
    scale.type = function () {
        return 'ordinal';
    };


    /**
     * Compute the data domain for this scale by looping through values and finding 
     * unique values
     *
     * @todo some of these checks, like same domain min/max and config need to be rethought
     */
    p.computeDomain = function () {
        var domain = [], temp;

        if (sonic.isArray(p.config.ticks.values)) {
            domain = p.config.ticks.values;
        } else {
            viz.data().forEach(function (s) {
                s.values.forEach(function (d, i) {
                    var dp = d[p.config.dataKey];
                    if (domain.indexOf(dp) === -1) {
                        domain.push(dp);
                    }
                });
            });
        }

        //Need to consider a better solution for multi series charts, the case
        //of grouped verse stacked, and the case where multiple datasets are in viz.data
        if (p.config.ticks.sortType === 'BYVALUE') {
            if (viz.data().length > 0) {
                temp = sonic.clone(viz.data())
                    .sort(p.config.ticks.sort)
                    .map(function (d) {
                        if (d.values.length > 0) {
                            return d.values[0][p.config.dataKey];
                        } else {
                            return "";
                        }
                    });
                domain.forEach(function (d) {
                    if (temp.indexOf(d) === -1) {
                        temp.push(d);
                    }
                });
                domain = temp.filter(function (d) { return d !== ""; });
            }
        } else if (p.config.ticks.sort) {
            domain = domain.sort(p.config.ticks.sort);
        }

        return domain;
    };

    /**
     * Use the base scale fn to generate the pixel range to show scale within
     */
    p.computeRange = function () {
        return sonic_scale_compute_range(
            viz,
            p.config.pos
        );
    };

    sonic.augment(scale, p, viz, 'registerable');
    //merge config
    scale.mergeConfig(initialConfig);

    scale();

    viz.register('scale', scale);

    return scale;
};

sonic.scale.time = function (viz, initialConfig) {
    var p = {
        d3Scale: null, //underlying d3 scale
        config: {
            /** 
             *  Unique id for this set of bars
             *  Note: A unique id will be generated by framework - this is 
             *  just useful for a way to get the bars by an id that you know
             */
            id: null,
            /**
             * The field that each data point uses for its scale value
             */
            dataKey: null,
            /**
             * The position of the scale (left, right, top, bottom) used 
             * to determine how to draw the range
             */
            pos: null,
            /**
             * The piece of the range to use to draw the scale within.  By 
             * default, will assume the full viz body height/width (depending 
             * on position), but this can be overridden.  For example, [0, .25]
             * would take up a quarter of viz body, along whichever 
             * edge the axis lies, [.25, .75] would take up middle 50%, etc.
             */
            range: null
        }
    };

    /**
     * Scale constructor generates and returns a d3 scale
     */
    function scale() {
        if (sonic.timezone === 'UTC') {
            p.d3Scale = d3.time.scale.utc()
                .domain(p.computeDomain())
                .range(p.computeRange());
        } else {
            p.d3Scale = d3.time.scale()
                .domain(p.computeDomain())
                .range(p.computeRange());
        }
    }

    /** Update this scale instance */
    scale.update = sonic.override(function () {
        return scale();
    });

    /** Getter for underlying scale */
    scale.scale = function () {
        return p.d3Scale;
    };

    /**
     * Getter/setter for domain (e.g. [minVal, maxVal])
     *
     * setToMax, if this fn used as a setter, will broaden the
     * existing domain based on both old and new domain, rather
     * than just using the new one wholesale
     *
     * TODO: Make sure this and scale.resetDomain actually work
     */
    scale.domain = function (domain, setToMax) {
        if (!sonic.isSet(domain)) {
            return p.d3Scale.domain();
        }

        if (setToMax) {
            p.d3Scale.domain(d3.extent(p.d3Scale.domain().concat(domain)));
        } else {
            p.d3Scale.domain(domain);
        }
    };

    scale.resetDomain = function () {
        scale.domain(p.computeDomain());
    };

    /** 
     * Takes in an interval value and finds the corresponding domain value 
     * for the first time in domain + interval
    */
    scale.domainIntervalToRange = function (val) {
        return p.d3Scale(new Date(p.d3Scale.domain()[0].getTime() + val));
    };

    /**
     * Takes in a range pixel value and finds the value difference between that 
     * and the first time in domain
     *
     * Useful to find a physical buffer space based on pixels
     */
    scale.domainRangeToInterval = function (val) {
        return p.d3Scale.invert(val).getTime() - p.d3Scale.domain()[0].getTime();
    };

    /**
     * When updating scale in axis, will direct code
     * to scale.range. This function differs in each scale type
     */
    scale.resetScale = function (range) {
        return this.range(range);
    };

    /**
     * Getter/setter for the range itself
     */
    scale.range = function (range) {
        if (!sonic.isSet(range)) {
            return p.d3Scale.range();
        }

        p.config.range = range;
        p.d3Scale.range(p.computeRange());

        return scale;
    };

    /**
     * Getter for the range extent
     */
    scale.rangeExtent = function () {
        return sonic_scale_range_extent(scale);
    };

    /**
     * Getter for the range min
     */
    scale.rangeMin = function () {
        return d3.min(p.d3Scale.range());
    };

    /**
     * Getter for the range max
     */
    scale.rangeMax = function () {
        return d3.max(p.d3Scale.range());
    };

    /**
     * Find the nearest value to the point based in, based on the 
     * data also passed in.  
     *
     * This happens here because the scale knows the data key, and also 
     * how to traverse the domain
     */
    scale.nearest = function (pnt, dat) {
        var nearest,
            val = pnt[p.config.dataKey];

        sonic.each(dat, function (k, v) {
            var currDist;

            currDist = Math.abs(v[p.config.dataKey].getTime() - val);

            if (!sonic.isSet(nearest)) {
                nearest = {};
            }

            if (!sonic.isSet(nearest.dist) || currDist < nearest.dist) {
                nearest.point = v;
                nearest.dist = currDist;

                if (currDist === 0) {
                    return false;
                }
            }
        });

        return nearest;
    };

    /**
     * Sort the values passed in, based on the data key
     */
    scale.sort = function (vals) {
        return vals.sort(sonic.sortByProp(p.config.dataKey));
    };

    /**
     * Get the distance in milliseconds between 2 values
     */
    scale.domainDistance = function (a, b) {
        return a.getTime() - b.getTime();
    };


    /**
     * Get the number of days in the domain
     */
    scale.numDays = function () {
        return d3.time.days(p.d3Scale.domain()[0], p.d3Scale.domain()[1]);
    };

    /** Getter for the position along the scale for the passed in value */
    scale.position = function (val) {
        return p.d3Scale(val);
    };

    /**
     * Exposes the d3 method for inverting a pixel range value into a 
     * domain value
     */
    scale.invert = function (val) {
        return p.d3Scale.invert(val);
    };

    /** Getter for the data key */
    scale.dataKey = function () {
        return p.config.dataKey;
    };

    /** Getter for the scale type */
    scale.type = function () {
        return 'time';
    };

    /**
     * Compute the data domain for this scale.  Use the base scale domain generator, then 
     * do linear scale related checks/adjustments
     *
     * @todo some of these checks, like same domain min/max and config need to be rethought
     */
    p.computeDomain = function () {
        var offset,
            domain,
            hours;

        domain = sonic_scale_compute_base_domain(viz.data(), p.config);

        if (domain.length === 0) {
            return [new Date(0), new Date(1000000)];
        }

        domain[0] = new Date(domain[0]);
        domain[1] = new Date(domain[1]);

        if (domain[0] === domain[1]) {
            //1 hour
            offset = 60 * 60 * 1000;
            hours = domain[0].getTime() % offset;
            if (hours === 0) {
                domain[1] = new Date(domain[1].getTime() + offset);
            } else if (hours === 23) {
                domain[0] = new Date(domain[1].getTime() - offset);
            } else {
                domain[0] = new Date(domain[0].getTime() - offset);
                domain[1] = new Date(domain[1].getTime() + offset);
            }
        }

        if (p.config.pad) {
            if (p.config.pad.max) {
                domain[1] = new Date(domain[1].getTime() + p.config.pad.max);
            }
            if (p.config.pad.min) {
                domain[0] = new Date(domain[0].getTime() - p.config.pad.min);
            }
        }

        return domain;
    };

    /**
     * Use the base scale fn to generate the pixel range to show scale within
     */
    p.computeRange = function () {
        return sonic_scale_compute_range(
            viz,
            p.config.pos
        );
    };

    sonic.augment(scale, p, viz, 'registerable');
    //merge config
    scale.mergeConfig(initialConfig);

    scale();

    viz.register('scale', scale);

    return scale;
};

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

sonic.heatmap = function (viz, initialConfig) {
    var p = {
        xScale: null,
        yScale: null,
        config: {
            id: null,
            cls: '',
            x1DataKey: 'x',
            x2DataKey: 'x2',
            y1DataKey: 'y',
            y2DataKey: 'y2',
            zDataKey: 'z',
            xScaleId: null,
            yScaleId: null,
            colorGradient: {},
            colorConfig: {
                colorRange: {
                    defaultRange: ['#FFFFFF', '#F20C0C']
                },
                valueRange: {},
                step: null
            },
            seriesKeys: null,
            seriesIndexes: null,
            opacity: 1,
            interactive: true,
            tooltip: {
                renderFn: null
            },
            zoom: false
        }
    };

    function heatmap (sel, opts) {
        var classes = [p.config.cls, 'sonic-heatmap-set', heatmap.id()],
            groups;

        p.selection = sel;

        p.computeData(opts || {});
        p.setScales();
        p.computeColors();

        groups = sel.selectAll(classes.join('.'))
            .data(p.data, function (s) {
                return s.key;
            });

        groups
            .enter()
            .insert('g', ':first-child')
            .classed(classes.join(' '), true);

        groups.each(p.drawHeatmap);

        groups.exit().remove();

        if (p.config.zoom) {
            p.addZoom(opts);
        }

        viz.registerVisibleContent(heatmap, heatmap.hasContent());
    }

    p.addZoom = function (opts) {
        viz.addZoom(
            heatmap.id(),
            {
                zoom: {
                    opts: opts,
                    fn: p.zoomAction
                }
            },
            p.xScale,
            p.yScale
        );
    };

    p.zoomAction = function (opts) {
        //this might be inefficient with larger datasets. Maybe consider
        //translating and scaling directly rather than calling point.
        heatmap(p.selection, opts);
    };

    p.computeData = function (opts) {
        p.data = [];
        if (opts.remove) {
            return;
        }

        p.data = sonic.clone(viz.dataBySeries(p.config.seriesKeys, p.config.seriesIndexes));

        p.data.forEach(function (s, i) {
            s.index = i;
            s.values = s.values.filter(function (d) {
                if (p.xScale && p.yScale && p.config.zoom) {
                    if (d[p.config.x1DataKey] < p.xScale.domain()[0] && d[p.config.x2DataKey] > p.xScale.domain()[0]) {
                        d[p.config.x1DataKey] = p.xScale.domain()[0];
                    }
                    if (d[p.config.x1DataKey] < p.xScale.domain()[1] && d[p.config.x2DataKey] > p.xScale.domain()[1]) {
                        d[p.config.x2DataKey] = p.xScale.domain()[1];
                    }
                    if (d[p.config.y1DataKey] < p.yScale.domain()[0] && d[p.config.y2DataKey] > p.yScale.domain()[0]) {
                        d[p.config.y1DataKey] = p.yScale.domain()[0];
                    }
                    if (d[p.config.y1DataKey] < p.yScale.domain()[1] && d[p.config.y2DataKey] > p.yScale.domain()[1]) {
                        d[p.config.y2DataKey] = p.yScale.domain()[1];
                    }
                    return !(d[p.config.x1DataKey] < p.xScale.domain()[0] || d[p.config.x2DataKey] > p.xScale.domain()[1] || d[p.config.y1DataKey] < p.yScale.domain()[0] || d[p.config.y2DataKey] > p.yScale.domain()[1]);
                }
                return true;
            });
        });
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
                p.xScale = viz.findOne('scale', { dataKey: p.config.x1DataKey });
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
                p.yScale = viz.findOne('scale', { dataKey: p.config.y1DataKey });
                p.config.yScaleId = p.yScale.id();
            }
        }
    };

    p.computeColors = function () {
        p.config.colorGradient = {};

        p.data.forEach(function (s) {
            var max = d3.max(s.values, function (d) { return d[p.config.zDataKey]; }),
                min = d3.min(s.values, function (d) { return d[p.config.zDataKey]; }),
                valueRange, colorRange;

            if (!p.config.colorConfig.colorRange[s.key]) {
                colorRange = p.config.colorConfig.colorRange.defaultRange;
            } else {
                colorRange = p.config.colorConfig.colorRange[s.key];
            }

            if (!p.config.colorConfig.valueRange[s.key]) {
                valueRange = d3.range(min, max + (max - min) / colorRange.length, (max - min) / (colorRange.length - 1));
            } else {
                valueRange = p.config.colorConfig.valueRange[s.key];
            }



            p.config.colorGradient[s.key] = sonic.colors.generateGradient(colorRange, valueRange, p.config.colorConfig.step);
        });
    };

    p.drawHeatmap = function (series, seriesIndex) {
        var dat = series.values,
            heatmap;

        heatmap = d3.select(this).selectAll('.sonic-heattile')
            .data(dat, function (d) {
                var xId, yId;
                if (d.bin) {
                    xId = d.bin;
                } else {
                    xId = d[p.config.x1DataKey] + '_' + d[p.config.x2DataKey];
                }
                if (d.bin2) {
                    yId = d.bin2;
                } else {
                    yId = d[p.config.y1DataKey] + '_' + d[p.config.y2DataKey];
                }
                return xId + '_' + yId;
            });

        heatmap.enter().append('rect')
            .classed('sonic-heattile', true)
            .style('stroke-width', 0)
            .attr('x', function (d) { return (p.xScale.position(d[p.config.x1DataKey]) + p.xScale.position(d[p.config.x2DataKey])) / 2; })
            .attr('y', function (d) { return (p.yScale.position(d[p.config.y2DataKey]) + p.yScale.position(d[p.config.y1DataKey])) / 2; })
            .attr('height', 0)
            .attr('width', 0);

        heatmap.transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('x', function (d) { return p.xScale.position(d[p.config.x1DataKey]); })
            .attr('y', function (d) { return p.yScale.position(d[p.config.y2DataKey]); })
            .attr('width', function (d) { return p.xScale.position(d[p.config.x2DataKey]) - p.xScale.position(d[p.config.x1DataKey]); })
            .attr('height', function (d) { return p.yScale.position(d[p.config.y1DataKey]) - p.yScale.position(d[p.config.y2DataKey]); })
            .attr('fill', function (d) { return d.color || p.config.colorGradient[series.key].getColor(d[p.config.zDataKey]).toString(); })
            .attr('fill-opacity', function (d) { return d.opacity || p.config.opacity; });

        heatmap.exit().remove();
    };

    p.onVizMouseMove = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        p.updateTooltips(mouse, cps);

        p.selection.selectAll('.sonic-heattile')
            .attr('fill', function (d, i) {
                var color;
                if(p.config.interactive && cps && cps.point === d){
                    color = p.config.colorGradient[cps.key].getColor(d[p.config.zDataKey]).brighter().toString();
                } else if (cps) {
                    color = p.config.colorGradient[cps.key].getColor(d[p.config.zDataKey]).toString();
                } else {
                    color = d3.select(this).attr('fill');
                }
                return color;
            });


        return cps;
    };

    p.closestPoints = function (mouse) {
        var x = mouse[0],
            y = mouse[1],
            point = null;

        p.data.forEach(function (d, i) {
            d.values.forEach(function (v) {
                var minX = Math.abs(p.xScale.position(v[p.config.x1DataKey])),
                    maxX = Math.abs(p.xScale.position(v[p.config.x2DataKey])),
                    minY = Math.abs(p.yScale.position(v[p.config.y2DataKey])),
                    maxY = Math.abs(p.yScale.position(v[p.config.y1DataKey]));

                if (minX <= x && maxX >= x && minY <= y && maxY >= y) {
                    point = {
                        point: v,
                        key: d.key
                    };
                }
            });
        });

        return point;
    };

    sonic.augment(heatmap, p, viz, 'registerable', 'listenable');

    heatmap.mergeConfig(initialConfig);

    viz.register('sonic-heatmap', heatmap);

    return heatmap;
};

function sonic_heatmap_add (v, c) {
    v.body().call(sonic.heatmap(v, c));
}

function sonic_heatmap_update (v, p, c) {
    v.find('sonic-heatmap', p).forEach(function (cmp) {
        cmp.mergeConfig(cmp);
        cmp.update();
    });
}

sonic_api.add('addHeat', sonic_heatmap_add);
sonic_api.add('updateHeat', sonic_heatmap_update);
sonic.point = function (viz, initialConfig) {
    var p = {
        xScale: null, //xScale
        yScale: null, //yScale
        defaultColors: sonic.colors.colorMap(), //default colors
        config: {
            /**
             *  Unique id for this set of points
             *  Note: A unique id will be generated by framework - this is
             *  just useful for a way to get the point collection by an id that you know
             */
            id: null,
            /**
             * Set of css classes
             */
            cls: '',
            /**
             * The field that makes each data point unique
             */
            definedDataKey: 'id',
            /**
             * The field that each data point uses for its x-axis value
             */
            xDataKey: 'x',
            /**
             * The field that each data point uses for its y-axis value
             */
            yDataKey: 'y',
            /**
             * Which scale (by id) to use for the x-axis.  Can be passed in, otherwise
             * auto-generated based on xDataKey
             */
            xScaleId: null,
            /**
             * Which scale (by id) to use for the y-axis.  Can be passed in, otherwise
             * auto-generated based on yDataKey
             */
            yScaleId: null,
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
             * Stroke color
             *
             * Note: Will use series colors instead from data if they are defined
             */
            stroke: '',
            strokeWidth: 1,
            /**
             * Fill color
             *
             * Note: Will use series colors instead from data if they are defined
             */
            fill: '',
            /**
             * d3 symbol to use to represent points in collection
             *
             * options are: circle, cross, diamond, square, triangle-down, triangle-up
             *
             * @todo allow arbitrary symbols using passed in svg, etc.
             */
            symbol: 'circle',
            /**
             * The pixel squared value (so, in this case 8x8) of the point
             */
            size: 64,
            /**
             * The multiplier of how big the point size should be when highlighted
             */
            highlightSizeScale: 2,
            /** Fill opacity */
            fillOpacity: 1,
            /* determine closest point based on 'x' or 'y' distance only */
            closestPointBy: null,
            /**
             * config for if you want labels on all points
             */
            standardLabel: {
                dx: -1,
                dy: 1,
                show: false,
                labelGenFn: function (dot) {
                    return dot.id;
                }
            },
            /**
             * config for the label you want on the highlighted point
             */
            highlightLabel: {
                dx: -3.5,
                dy: 3.3,
                show: false,
                textColor: '#000000',
                bkgrdColor: '#ffffff',
                labelGenFn: function (dot) {
                    return dot.id;
                }
            },
            /** Tooltip config */
            tooltip: {
                /**
                 * Only show the tooltip if closest point is within a certain
                 * buffer area - can be by value, or by pixel
                 */
                buffer: {
                    type: 'value', //value, pixel, or radius
                    amount: null //value, or px amount
                },
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
            },
            zoom: false
        }
    };

    /**
     * Point constructor renders the point(s)
     *
     * @param {d3.selection} sel where to render to
     * @param {Object} opts extra information on how to render
     *   generally used to specify custom transitions
     */
    function point(sel, opts) {
        var classes = [p.config.cls, 'sonic-point-set', point.id()],
            groups;

        //update this line instance's selection to match the current one
        p.selection = sel;

        p.computeData();
        p.setScales();

        //group for each series
        groups = sel.selectAll(classes.join('.'))
            .data(p.data, function (d) {
                return d.key;
            });

        //create groups for any new series
        groups.enter().append('g')
            .classed(classes.join(' '), true);

        groups.each(p.drawPoints);

        groups.each(p.setupLegend);

        groups.exit().remove();

        if (p.config.zoom) {
            p.addZoom(opts);
        }

        viz.registerVisibleContent(point, point.hasContent());
    }

    p.addZoom = function (opts) {
        viz.addZoom(
            point.id(),
            {
                zoom: {
                    opts: opts,
                    fn: p.zoomAction
                }
            },
            p.xScale,
            p.yScale
        );
    };

    p.zoomAction = function (opts) {
        //this might be inefficient with larger datasets. Maybe consider
        //translating and scaling directly rather than calling point.
        point(p.selection, opts);
    };

    /**
     * Compute this instance's data from the viz data, using the passed
     * in series keys or indexes
     */
    p.computeData = function (opts) {
        opts = opts || {};
        p.data = [];

        if (opts.remove) {
            return;
        }
        p.data = sonic.clone(viz.dataBySeries(p.config.seriesKeys, p.config.seriesIndexes));

        /** Used for default colors - @todo probably a better way */

        p.data.forEach(function (s, i) {
            s.index = i;
            s.values = s.values.filter(function (d) {
                if (p.xScale && p.yScale && p.config.zoom) {
                    return !(d[p.config.xDataKey] < p.xScale.domain()[0] || d[p.config.xDataKey] > p.xScale.domain()[1] || d[p.config.yDataKey] < p.yScale.domain()[0] || d[p.config.yDataKey] > p.yScale.domain()[1]);
                } else {
                    return true;
                }
            });
        });

    };

    /**
     * Sets the x and y scales for this instance  If an actual scale
     * passed in, uses that.  If a scale id passed in, use it,
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
                p.config.yScaleId = p.yScale.id();
            }
        }
    };

    /**
     * Compute a point's color
     */
    p.computeColor = function (d, i, series, stroke) {
        return  (stroke && d.stroke) || d.color || series.color || p.defaultColors(series.index);
    };

    /**
     * Symbol generator
     *
     * If passed a list of closest points, will adjust size of point
     * accordingly
     */
    p.symbolGenerator = function (cps) {
        return d3.svg.symbol()
            .type(function (d) {
                return d.type || p.config.type;
            })
            .size(function (d) {
                var size = d.size || p.config.size;
                if (p.isClosestPoint(d, cps)) {
                    size = size * p.config.highlightSizeScale;
                }
                return size;
            });
    };

    /**
     * Draw points for the given line series
     * @TODO transitions for the symbol paths throws errors, but don't break anything
     */
    p.drawPoints = function (series, seriesIndex) {
        var dat = [],
            symGen = p.symbolGenerator(),
            points;

        dat = series.values;

        points = d3.select(this).selectAll('.sonic-point')
            .data(dat, function (d) {
                return d[p.config.definedDataKey];
            });

        points.enter().append('path')
            .classed(point.id() + ' sonic-point', true)
            .attr('fill-opacity', function (d) { return sonic.isSet(d.fillOpacity) ? d.fillOpacity : p.config.fillOpacity; })
            .style('opacity', function (d) { return sonic.isSet(d.opacity) ? d.opacity : 1; })
            .attr('d', 'M0,0');

        points
            .attr('d', symGen)
            .transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('transform', function (d) {
                return 'translate(' +
                    p.xScale.position(d[p.config.xDataKey]) + ',' +
                    p.yScale.position(d[p.config.yDataKey]) + ')';
            })
            .attr('stroke', function (d, i) {
                return p.computeColor.call(this, d, i, series, true);
            })
            .attr('stroke-width', function (d, i) {
                return d.strokeWidth || p.config.strokeWidth;
            })
            .attr('fill', function (d, i) {
                return p.computeColor.call(this, d, i, series);
            })
            .attr('fill-opacity', function (d) { return sonic.isSet(d.fillOpacity) ? d.fillOpacity : p.config.fillOpacity; })
            .style('opacity', function (d) { return sonic.isSet(d.opacity) ? d.opacity : 1; });

        points.sort(function (a, b) {
            if (a.selected && !b.selected) {
                return 1;
            } else if (!a.selected && b.selected) {
                return -1;
            }
            return 0;

        });
        points.exit().remove();
    };

    p.setupLegend = function (series, i, opts) {
        d3.select(this).selectAll('path')
            .attr(point.id() + '-data-legend', function () {
                return series.name || series.key;
            });
    };

    /**
     * draw labels on top of symbols, so, like, a number inside a circle
     */
    p.drawLabel = function (dots, type) {
        var label;

        label = d3.select(this).selectAll('.symLabel')
            .data(dots, function (d) {
                return d.point[p.config.definedDataKey];
            });

        label.enter().append('text')
            .classed(point.id() + ' symLabel', true);

        label.attr('transform', function (d) {
                return 'translate(' +
                    p.xScale.position(d.point[p.config.xDataKey]) + ',' +
                    p.yScale.position(d.point[p.config.yDataKey]) + ')';
            })
            .attr('dx', function (d) {
                return p.config[type].dx * d.point.markerId.toString().length;
            })
            .attr('dy', p.config[type].dy)
            .text(function (d) {
                return p.config[type].labelGenFn(d.point);
            })
            .style('fill', function (d) {
                return p.config.highlightLabel.textColor;
            });

        label.exit().remove();
    };

    /**
     * On viz mouse move, find closest points
     * and update tooltips accordingly
     */
    p.onVizMouseMove = function (mouse) {
        var cps,
            pointSets,
            symGen;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        symGen = p.symbolGenerator(cps);

        p.updateTooltips(mouse, cps);

        pointSets = d3.selectAll('.' + point.id() + '.sonic-point-set').selectAll('.' + point.id() + ' .sonic-point');

        pointSets.sort(function (a, b) {
                if (p.isClosestPoint(a, cps)) {
                    return 1;
                }
                if (p.isClosestPoint(b, cps)) {
                    return -1;
                }
                return 0;
            })
            .attr('fill', function (d, i) {
                var color,
                    series = d3.select(this.parentElement).data()[0];

                color = p.computeColor.call(this, d, i, series);

                if (p.isClosestPoint(d, cps)) {
                    if (p.config.highlightLabel.show) {
                        color = p.config.highlightLabel.bkgrdColor;
                    } else {
                        color = d3.rgb(color).brighter().brighter().toString();
                    }
                }

                return color;
            })
            .attr('d', symGen);

        if (p.config.highlightLabel.show) {
            if (cps) {
                pointSets.forEach(function(v, i) {
                    p.drawLabel.call(v.parentNode, [cps[i]], 'highlightLabel');
                }, this);
            } else {
                d3.selectAll('.symLabel').remove();
            }
        }

        return cps;
    };

    /*
     * On viz mouse click, find closest points,
     * update tracer to put the click tracer there,
     * and then return them
     */
    p.onVizClick = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        p.selection.selectAll('.sonic-point')
            .classed('selected', function (d, i) {
                return p.isClosestPoint(d, cps);
            });

        return cps;
    };

    /**
     * Find closest points to mouse.
     * Note changes: will only be a valid closestPoint if within the yScale of the viz.
     */
    p.closestPoints = function (mouse) {
        var cps,
            inRange,
            noConfig,
            x = mouse[0],
            y = mouse[1];

        if(sonic.isSet(p.config.tooltip) && sonic.isSet(p.config.tooltip.buffer) && sonic.isSet(p.config.tooltip.buffer.value) === true) {
            inRange = (y >= p.yScale.rangeMin() && y <= p.yScale.rangeMax());
            if (inRange === false) {
                return [];
            }
        } else {
            noConfig = true;
        }

        if (inRange || noConfig) {
            cps = p.data.map(function (d) {
                return {
                    key: d.key,
                    dist: null,
                    point: null
                };
            });

            p.data.forEach(function (d, i) {
                d.values.forEach(function (v) {
                    var dist,
                        xDist,
                        yDist;

                    xDist = Math.abs(p.xScale.position(v[p.config.xDataKey], 'center') - x);
                    yDist = Math.abs(p.yScale.position(v[p.config.yDataKey], 'center') - y);
                    if (p.config.closestPointBy === 'x') {
                        dist = xDist;
                    } else if (p.config.closestPointBy === 'y') {
                        dist = yDist;
                    } else {
                        dist = sonic.geom.pythagorize(xDist, yDist);
                    }

                    if (!cps[i].point || dist < cps[i].dist) {
                        //check to make sure point is within buffer before
                        //considering it actually a close point
                        if (p.pointWithinBuffer(v, dist)) {
                            cps[i].point = v;
                            cps[i].dist = dist;
                        }
                    }
                });
            });

            //if no closest points in a series, don't return that series
            cps = cps.filter(function (d) {
                return (sonic.isSet(d.point)) ? true : false;
            });

            return cps;
        }
    };

    /**
     * Is the current point one of the closest points that has been
     * identified elsewhere
     */
    p.isClosestPoint = function (d, closestPoints) {
        if (!sonic.isArray(closestPoints)) {
            return false;
        }

        return closestPoints.filter(function (cp) {
            return cp.point[p.config.definedDataKey] === d[p.config.definedDataKey];
        }).length > 0;
    };

    /**
     * Update tooltips
     */
    p.updateTooltips = function (mouse, cps) {
        var content,
            renderFn = p.config.tooltip.renderFn || p.renderTooltips;

        if (p.config.tooltip) {
            p.config.tooltip.associatedId = point.id();
            if (mouse) {
                if (cps.length > 0) {
                    p.config.tooltip.closestPoints = cps;
                    p.config.tooltip.content = renderFn(cps, mouse);
                    p.config.tooltip.mouse = mouse;
                    viz.showTooltip(p.config.tooltip);
                } else {
                    viz.removeTooltip(p.config.tooltip);
                }
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
                '<b>' + p.config.yDataKey + ':</b>' + cp.point[p.config.yDataKey];

            return html + '</p>';
        }).reduce(function (last, curr) {
            return last + curr;
        });
    };

    /**
     * Is the point, alongside its px distance within the buffer?
     *
     * Can use value, or pixel as buffer
     */
    p.pointWithinBuffer = function (point, pxDistance) {
        var withinBuffer = true,
            radius = Math.sqrt(point.size || p.config.size) / 2;

        if (sonic.isSet(p.config.tooltip) && sonic.isSet(p.config.tooltip.buffer) && sonic.isSet(p.config.tooltip.buffer.amount)) {
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
        } else if (sonic.isSet(p.config.tooltip) && sonic.isSet(p.config.tooltip.buffer) && p.config.tooltip.buffer.type === 'radius') {
            if (pxDistance > radius) {
                withinBuffer = false;
            }
        }

        return withinBuffer;
    };

    point.updatePoint = function (dp) {
        var pt = p.selection.selectAll('.sonic-point')
            .filter(function (d) { return d.id === dp.id; }),
            symGen = p.symbolGenerator(),
            series;

        pt.data().forEach(function (d) { sonic.object.merge(d, dp); });

        viz.dataBySeries(p.config.seriesKeys, p.config.seriesIndexes).forEach(function (s) {
            series = s;
            s.values
                .filter(function(d) { return d.id === dp.id; })
                .forEach(function (d) {
                    sonic.object.merge(d, dp);
                });
        });

        pt
            .attr('d', symGen)
            .transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('transform', function (d) {
                return 'translate(' +
                    p.xScale.position(d[p.config.xDataKey]) + ',' +
                    p.yScale.position(d[p.config.yDataKey]) + ')';
            })
            .attr('stroke', function (d, i) {
                return p.computeColor.call(this, d, i, series, true);
            })
            .attr('stroke-width', function (d, i) {
                return d.strokeWidth || p.config.strokeWidth;
            })
            .attr('fill', function (d, i) {
                return p.computeColor.call(this, d, i, series);
            })
            .attr('fill-opacity', function (d) { return sonic.isSet(d.fillOpacity) ? d.fillOpacity : p.config.fillOpacity; })
            .style('opacity', function (d) { return sonic.isSet(d.opacity) ? d.opacity : 1; });
    };

    sonic.augment(point, p, viz, 'registerable', 'listenable');
    //merge config
    point.mergeConfig(initialConfig);
    //register this point
    viz.register('sonic-point', point);

    return point;
};

/**
 * Add a point or collection of points to the viz body
 *
 * @todo ability to pass 1 point, and it be converted
 * into correct form
 */
function sonic_point_add(v, c) {
    v.body().call(sonic.point(v, c));
}


/**
 * Remove points from the viz body
 */
function sonic_point_remove(v, c) {
    v.remove('sonic-point', c);
}

/**
 * Update matching points in viz v, based on params p,
 * to have config c
 */
function sonic_point_update(v, p, c) {
    v.find('sonic-point', p).forEach(function (cmp) {
        cmp.mergeConfig(c);
        cmp.update();
    });
}

function sonic_point_update_single(v, p, pt) {
    v.find('sonic-point', p).forEach(function (cmp) {
        cmp.updatePoint(pt);
    });
}

/* Public API Methods */
sonic_api.add('addPoint', sonic_point_add);
sonic_api.add('addPoints', sonic_point_add);
sonic_api.add('updatePoint', sonic_point_update);
sonic_api.add('updatePoints', sonic_point_update);
sonic_api.add('removePoint', sonic_point_remove);
sonic_api.add('removePoints', sonic_point_remove);
sonic_api.add('updateSinglePoint', sonic_point_update_single);

sonic.network = function (viz, initialConfig) {
    var p = {
        network: d3.layout.force(),
        nodeToLinkMap: {},
        colorGradient: null,
        config: {
            type: 'sonic-network',
            cls: '',
            nodeIdKey: 'id',
            nodeDisplayKey: 'name',
            nodeGroupKey: 'group',
            nodeCircleRadiusKey: 'radius',
            nodeFillKey: 'fill',
            nodeImageKey: 'image',
            nodeImageHighlightKey: 'highlightImage',
            nodeImageWidthKey: 'width',
            nodeImageHeightKey: 'height',
            layoutOpts: {
                size: [viz.body().height() * 0.8, viz.body().width() * 0.8]
            },
            linkStyle: {
                opacity: 1,
                strokeWidth: 2,
                highlightStrokeWidthGrowth: 2,
                highlightStrokeColor: '#CCCCCC',
                stroke: '#CCCCCC',
                showDirections: true,
                gradient: null
            },
            //default node styling
            nodeStyle: {
                opacity: 0.7,
                strokeWidth: 2,
                colorBy: 'depth',
                nodeColors: sonic.colors.colorMap(),
                radius: 5,
                highlightRadiusGrowth: 3,
                label: {
                    fill: '#555',
                    fontFamiy: 'arial',
                    fontSize: '12px',
                    anchor: 'middle'
                },
                range: null
            },
            tooltip: {
                buffer: {
                    type: 'value',
                    amount: null
                }
            },
            networkForce: {
                gravity: 0.05,
                distance: 100,
                charge: -100
            }
        }
    };

    function network(sel, opts) {
        var classes = [p.config.cls, 'sonic-network'],
            groups;

        p.selection = sel;

        p.setupNetworkLayout();

        p.computeData(opts || {});

        groups = p.selection.selectAll('.sonic-network.' + network.id())
            .data([1]);

        groups.enter().append('g')
            .classed('sonic-network ' + network.id(), true);

        groups.each(p.drawNetwork);

        groups.exit().remove();

        viz.registerVisibleContent(network, network.hasContent());

    }

    network.hasContent = sonic.override(function () {
        return p.data.nodes && p.data.nodes.length > 0;
    });

    p.setupNetworkLayout = function () {
        var size = p.calcLayoutSize();
        p.network
            .size(size);
    };

    p.calcLayoutSize = function () {
        var size = p.config.layoutOpts.size;

        if (initialConfig && initialConfig.layoutOpts && initialConfig.layoutOpts.size) {
            size = initialConfig.layoutOpts.size;
        } else {
            size = p.calcLayoutLinear();
        }
        return size;
    };

    p.calcLayoutLinear = function () {
        return [p.calcHeight(), p.calcWidth()];
    };

    p.calcWidth = function () {
        return viz.body().width() * 0.8;
    };

    p.calcHeight = function () {
        return viz.body().height() * 0.8;
    };

    p.computeData = function (opts) {
        var i,
            j,
            data = viz.data()[0].values,
            linkMax = null,
            linkMin = null,
            curNodes = p.selection.selectAll('.node');

        p.colorGradient = null;
        p.nodeToLinkMap = {};

        p.data = {
            nodes: [],
            links: []
        };

        if (opts.remove) {
            return;
        }

        if (viz.data()[0] && viz.data()[0].values) {
            p.data.nodes = viz.data()[0].values;
        }

        if (viz.data()[1] && viz.data()[1].values) {
            p.data.links = viz.data()[1].values;
            p.data.links.forEach(function (link) {
                for (i = 0; i < p.data.nodes.length; i++) {
                    if (p.data.nodes[i][p.config.nodeIdKey] === link.source) {
                        link.source = p.data.nodes[i];
                    }
                }

                for (j = 0; j < p.data.nodes.length; j++) {
                    if (p.data.nodes[j][p.config.nodeIdKey] === link.target) {
                        link.target = p.data.nodes[j];
                    }
                }

                if (!p.nodeToLinkMap[link.source[p.config.nodeIdKey]]) {
                    p.nodeToLinkMap[link.source[p.config.nodeIdKey]] = [];
                }

                if (!p.nodeToLinkMap[link.target[p.config.nodeIdKey]]) {
                    p.nodeToLinkMap[link.target[p.config.nodeIdKey]] = [];
                }

                p.nodeToLinkMap[link.source[p.config.nodeIdKey]].push(link);
                p.nodeToLinkMap[link.target[p.config.nodeIdKey]].push(link);

                if (!sonic.isSet(linkMax) || link.weight > linkMax) {
                    linkMax = link.weight;
                }
                if (!sonic.isSet(linkMin) || link.weight < linkMin) {
                    linkMin = link.weight;
                }
            });
        }



        p.data.nodes.forEach(function (n) {
            n.links = p.nodeToLinkMap[n[p.config.nodeIdKey]];
            if (p.config.persistMove) {
                p.persistMove(n, curNodes);
            }
        });

        if (sonic.isSet(p.config.linkStyle.gradient)) {
            //if range spans pos and neg numbers
            if (linkMin * linkMax < 0) {
                //first half of gradient spans negative numbers, second half spans positive numbers
                //ie if values are ['red', 'black', 'green'] and link min is -1 and link max is 100 then red to black
                //maps values -1 to 0 and black to green maps 0 to 100
                p.colorGradient = sonic.colors.generateGradient(p.config.linkStyle.gradient, [linkMin, 0, linkMax]);
            } else {
                //color gradient ranges evenly over min and max
                p.colorGradient = sonic.colors.generateGradient(p.config.linkStyle.gradient, [linkMin, linkMax]);
            }
        }

        if (p.config.nodeStyle.range) {

            p.dataMin = d3.min(data, function (d) {
                return d[p.config.nodeCircleRadiusKey];
            });

            p.dataMax = d3.max(data, function (d) {
                return d[p.config.nodeCircleRadiusKey];
            });
        }
    };

    p.persistMove = function (node, currentNodes) {
        currentNodes.each(function (n) {
            if (node[p.config.nodeIdKey] === n[p.config.nodeIdKey] && n.moved === true) {
                node.x = node.pinX || n.x;
                node.y = node.pinY || n.y;
                node.moved = !node.pinX;
                node.fixed = !node.pinY;
            }
        });
    };

    p.drawNetwork = function () {
        var link,
            node;

        p.network
            .gravity(p.config.networkForce.gravity)
            .distance(p.config.networkForce.distance)
            .charge(p.config.networkForce.charge)
            .size([p.calcWidth(), p.calcHeight()])
            .nodes(p.data.nodes)
            .links(p.data.links)
            .start();

        link = p.addLinks.apply(this);
        node = p.addNodes.apply(this);

        p.network.on("tick", function() {
            node.attr("transform", function(d) {
                if (sonic.isSet(d.locationOffset) && !d.moved) {
                    d.x = viz.body().width() / 2 + (viz.body().width() / 2 * d.locationOffset.x);
                    d.y = viz.body().height() / 2 + (viz.body().height() / 2 * d.locationOffset.y);
                }

                if (sonic.isSet(d.pinX) && !d.moved) {
                    d.x = d.pinX;
                }

                if (sonic.isSet(d.pinY) && !d.moved) {
                    d.y = d.pinY;
                }

                if (d.x < 0) {
                    d.x = 0;
                } else if (d.x > viz.body().width()) {
                    d.x = viz.body().width();
                }

                if (d.y < 0) {
                    d.y = 0;
                } else if (d.y > viz.body().height()) {
                    d.y = viz.body().height();
                }

                return "translate(" + d.x + "," + d.y + ")";
            });

            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
        });
    };

    p.addLinks = function () {
        var link,
            newLink;

	// Using g group to assure links always appear below nodes and text
        d3.select(this).append("g").attr("id", "links");

        link = d3.select("#links").selectAll(".link")
            .data(p.network.links(), function (d) {
                return d.source[p.config.nodeIdKey] + '_' + d.target[p.config.nodeIdKey];
            });

        newLink = link.enter().append("line")
            .classed('link', true);

        link
            .style('stroke', function (d) {
                return sonic.isSet(p.colorGradient) ? p.colorGradient.getColor(d.weight).toString() : (d.stroke || d.color || p.config.linkStyle.stroke);
            })
            .style('stroke-width', function (d) {
                return p.config.linkStyle.strokeWidth;
            });

        link.exit().remove();
        return link;
    };

    p.addNodes = function () {
        var node,
            newNode,
            drag;

        drag = p.network.drag().on("dragstart", p.dragstart);

        node = d3.select(this).selectAll(".node")
            .data(p.data.nodes, function (d) {
                return parseInt(d[p.config.nodeIdKey], 10);
            });

        newNode = node.enter().append("g")
            .classed('node', true)
            .classed('fixed', function (d) {
                if (sonic.isSet(d.locationOffset) || (sonic.isSet(d.pinX) && sonic.isSet(d.pinY))) {
                    d.fixed = true;
                    return true;
                } else {
                    return false;
                }
            });

        node.call(drag);

        newNode.append("circle");

        node.selectAll('g circle')
            .attr('r', function (d) {
                var size = p.calcNodeSize(d);
                if (size.height && size.width) {
                    return 0;
                } else {
                    return size;
                }
            })
            .style('fill', function (d) {
                return p.getNodeColor.call(this, d);
            })
            .style('fill-opacity', p.config.nodeStyle.opacity)
            .style('stroke', function (d) {
                return d3.rgb(p.getNodeColor.call(this, d)).darker();
            })
            .style('stroke-width', p.config.nodeStyle.strokeWidth);

        newNode.append("image");

        node.selectAll('g image')
            .attr('xlink:href', function (d) {
                return p.getNodeImage.apply(this, arguments);
            })
            .attr("y", function (d) {
                var size = p.calcNodeSize(d);
                return size.height ? -1 * size.height / 2 : -10;
            })
            .attr("x", function (d) {
                var size = p.calcNodeSize(d);
                return size.width ? -1 * size.width / 2 : -10;
            })
            .attr("width", function (d) {
                var size = p.calcNodeSize(d);
                return size.width ? size.width : 16;
            })
            .attr("height", function (d) {
                var size = p.calcNodeSize(d);
                return size.height ? size.height : 16;
            });

        if (p.config.nodeStyle.label) {
            newNode.append("text");

            node.selectAll('g text')
                .attr('dx', function (d) {
                    return p.config.nodeStyle.label.dx || 0;
                })
                .attr("dy", function (d) {
                    if (p.config.nodeStyle.label.dy) {
                        return p.config.nodeStyle.label.dy;
                    } else {
                        var size = p.calcNodeSize(d);
                        if (size.height && size.width) {
                            return -1 * size.height / 2 - 5;
                        } else {
                            return -1 * size - 5;
                        }
                    }
                })
                .style('fill', p.config.nodeStyle.label.fill)
                .style('stroke', 'none')
                .style('font-size', p.config.nodeStyle.label.fontSize)
                .style('font-family', p.config.nodeStyle.label.fontFamily)
                .style('text-anchor', p.config.nodeStyle.label.anchor)
                .text(function(d) { return d[p.config.nodeDisplayKey]; });

        }

        node.exit().remove();
        return node;
    };

    p.dragstart = function (d) {
        d.fixed = true;
        d.moved = true;
        d3.select(this).classed("fixed", true);
    };

    p.dragstop = function (d) {
        d.dragging = false;
    };

    /**
     * Returns the size of the node. If it's a circle, returns the radius
     * otherwise returns the height and width of the node image.
     */
    p.calcNodeSize = function (d) {
        if (d && d[p.config.nodeImageKey] && sonic.isSet(d[p.config.nodeImageHeightKey]) &&
            sonic.isSet(d[p.config.nodeImageWidthKey])) {
            return {
                height: d[p.config.nodeImageHeightKey],
                width: d[p.config.nodeImageWidthKey]
            };
        } else if (d && sonic.isSet(d[p.config.nodeCircleRadiusKey])) {
            var range = p.config.nodeStyle.range,
                dataPercent;

            if (range) {
                dataPercent = (d[p.config.nodeCircleRadiusKey] - p.dataMin) / (p.dataMax - p.dataMin);
                return (range[1] - range[0]) * dataPercent + range[0];
            } else {
                return d[p.config.nodeCircleRadiusKey];
            }
        } else {
            return p.config.nodeStyle.radius;
        }
    };

    p.getNodeColor = function (d, i) {
        var color = d.color;
        if (!color) {
            if (p.config.nodeStyle.colorBy === 'depth') {
                color = p.config.nodeStyle.nodeColors(d.depth);
            } else {
                color = p.config.nodeStyle.nodeColors(d[p.config.nodeGroupKey]);
            }
        }

        if (sonic.svg.hasClass(this, 'selected')) {
            color = d3.rgb(color).darker().toString();
        }
        return color;
    };

    p.getNodeImage = function (d, i) {
        var image;

        if (d[p.config.nodeImageKey]) {
            image = d[p.config.nodeImageKey];
        }

        if (sonic.svg.hasClass(this, 'selected') && d[p.config.nodeImageHighlightKey]) {
            image = d[p.config.nodeImageHighlightKey];
        }
        return image;
    };

    p.closestPoints = function (mouse) {
        var nodeSize,
            cps = p.getClosestPoints(p.data, mouse);

        nodeSize = p.calcNodeSize(cps[0]);

        if (nodeSize.height && nodeSize.width) {
            if (cps[1] < Math.max(nodeSize.height, nodeSize.width)) {
                return cps;
            }
        } else {
            if (cps[1] < nodeSize) {
                return cps;
            }
        }
        return [];
    };

    p.isClosestPoint = function (d, cps) {
        var isClosest = false;

        if (cps) {
            cps.forEach(function (c) {
                if (c && c[p.config.nodeIdKey] === d[p.config.nodeIdKey]) {
                    isClosest = true;
                }
            });
        }

        return isClosest;
    };

    p.getClosestPoints = function (data, mouse) {
        var cps = [null, null];

        if (data.nodes) {
            data.nodes.forEach(function (d) {
                var dist = Math.sqrt(Math.pow(mouse[0] - d.x, 2) +
                    Math.pow(mouse[1] - d.y, 2));
                if (!cps[1] || dist < cps[1]) {
                    cps = [d, dist];
                }
            });
        }

        return cps;
    };

    /**
     * Handles clicking on a node.
     */
    p.onVizClick = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        p.selection.selectAll('.sonic-network.' + network.id() + ' g circle')
            .classed('selected', function (d, i) {
                return p.isClosestPoint(d, cps);
            })
            .style('fill', function (d) {
                return p.getNodeColor.apply(this, arguments);
            })
            .style('stroke', function (d) {
                return d3.rgb(p.getNodeColor.apply(this, arguments)).darker();
            });

        p.selection.selectAll('.sonic-network.' + network.id() + ' g image')
            .classed('selected', function (d, i) {
                return p.isClosestPoint(d, cps);
            })
            .attr('xlink:href', function (d) {
                return p.getNodeImage.apply(this, arguments);
            });

        return cps;
    };

    /**
     * Handles mousing over a node.
     */
    p.onVizMouseMove = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        p.updateTooltips(mouse, cps);
        p.selection.selectAll('.sonic-network.' + network.id() + ' g circle:not(.selected)')
            .style('fill', function (d) {
                var color = p.getNodeColor.apply(this, arguments);
                return p.isClosestPoint(d, cps) ? d3.rgb(color).brighter() : color;
            })
            .style('stroke', function (d) {
                var color = p.getNodeColor.apply(this, arguments);
                color = d3.rgb(color).darker();
                return p.isClosestPoint(d, cps) ? d3.rgb(color).brighter() : color;
            });

        p.selection.selectAll('.sonic-network.' + network.id() + ' g image:not(.selected)')
            .attr('xlink:href', function (d) {
                if (p.isClosestPoint(d, cps) && d[p.config.nodeImageHighlightKey]) {
                    return d[p.config.nodeImageHighlightKey];
                } else {
                    return p.getNodeImage.apply(this, arguments);
                }

            });

        p.selection.selectAll('.sonic-network.' + network.id() + ' line')
            .style('stroke-width', function (d) {
                var w = p.config.linkStyle.strokeWidth;
                return ((cps && cps.length > 0 && cps[0][p.config.nodeIdKey] === d.source[p.config.nodeIdKey] ||
                    (cps && cps.length > 0 && cps[0][p.config.nodeIdKey] === d.target[p.config.nodeIdKey])) ? w +
                    p.config.linkStyle.highlightStrokeWidthGrowth : w);
            })
            .style('stroke', function (d) {
                return ((cps && cps.length > 0 && cps[0][p.config.nodeIdKey] === d.source[p.config.nodeIdKey] ||
                    (cps && cps.length > 0 && cps[0][p.config.nodeIdKey] === d.target[p.config.nodeIdKey])) ?
                    p.config.linkStyle.highlightStrokeColor : (sonic.isSet(p.colorGradient) ? p.colorGradient.getColor(d.weight).toString() : (d.stroke || d.color || p.config.linkStyle.stroke)));
            });

        return cps;
    };

    /**
     * Update tooltips
     */
    p.updateTooltips = function (mouse, cps) {
        var renderFn = p.config.tooltip.renderFn || p.renderTooltips;

        if (p.config.tooltip) {
            if (mouse && cps.length > 0) {
                p.config.tooltip.closestPoints = cps;
                p.config.tooltip.content = renderFn(cps, mouse);
                p.config.tooltip.associatedId = network.id();
                p.config.tooltip.mouse = mouse;

                viz.showTooltip(p.config.tooltip);
            } else {
                viz.hideTooltip(p.config.tooltip);
            }
        }
    };

    /**
     * Render nodes and links by default
     */
    p.config.tooltip.renderFn = function (cps) {
        var content = '',
            nodeName;
        nodeName = cps[0].name;
        content = '<b>' + nodeName + '</b>';

        return content;
    };

    sonic.augment(network, p, viz, 'registerable', 'listenable');

    network.mergeConfig(initialConfig);

    viz.register('sonic-network', network);

    return network;
};

function sonic_network_add (v, c) {
    v.body().call(sonic.network(v, c));
}

function sonic_network_remove (v, c) {
    v.remove('sonic-network', c);
}

function sonic_network_update(v, p, c) {
    v.find('sonic-network', p).forEach(function (cmp) {
        cmp.mergeConfig(c);
        cmp.update();
    });
}

sonic_api.add('addNetwork', sonic_network_add);
sonic_api.add('updateNetwork', sonic_network_update);
sonic_api.add('removeNetwork', sonic_network_remove);

sonic.tree = function (viz, initialConfig) {
    var p = {
        tree: d3.layout.tree(),
        config: {
            type: 'sonic-tree',
            cls: '',
            nodeIdKey: 'id',
            nodeDisplayKey: 'name',
            nodeGroupKey: 'group',
            nodeSizeKey: 'radius',
            nodeFillKey: 'fill',
            childrenKey: 'children',
            verticalTree: true,
            collapsible: false,
            layoutOpts: {
                size: [viz.body().height() * 0.8, viz.body().width() * 0.8],
                separation: function (a, b) {
                    return (a.parent === b.parent ? 1 : 2) / a.depth;
                },
                linkPathGenerator: d3.svg.diagonal()
                    .projection (function (d) {
                        if (p.config.verticalTree) {
                            return [d.x, d.y];
                        } else {
                            return [d.y, d.x];
                        }
                    })
            },
            linkStyle: {
                opacity: 1,
                strokeWidth: 2,
                highlightStrokeWidthGrowth: 2,
                stroke: '#CCCCCC',
                highlightStrokeChange: 'darker',
                showDirections: true
            },
            //default node styling
            nodeStyle: {
                opacity: 0.7,
                strokeWidth: 2,
                colorBy: 'depth',
                nodeColors: d3.scale.category20(),
                radius: 5,
                highlightRadiusGrowth: 3,
                highlightStrokeChange: 'brighter',
                highlightFillChange: 'brighter',
                collapsedFillColor: '#fff',
                labelNode: false,
                label: {
                    fill: '#555',
                    fontFamiy: 'arial',
                    fontSize: '12px',
                    anchor: 'middle'
                }
            },
            tooltip: {
                buffer: {
                    type: 'value',
                    amount: null
                }
            }
        }
    };

    function tree(sel, opts) {
        var classes = [p.config.cls, 'sonic-network'],
            groups;

        p.selection = sel;

        p.setupTreeLayout();

        p.computeData(opts || {});

        groups = p.selection.selectAll('.sonic-tree.' + tree.id())
            .data([1]);

        groups.enter().append('g')
            .classed('sonic-tree ' + tree.id(), true);

        groups.each(p.drawTree);

        groups.exit().remove();

    }

    p.setupTreeLayout = function () {
        var size = p.calcLayoutSize();
        p.tree
            .size(size);
    };

    p.calcLayoutSize = function () {
        var size = p.config.layoutOpts.size;

        if (initialConfig && initialConfig.layoutOpts && initialConfig.layoutOpts.size) {
            size = initialConfig.layoutOpts.size;
        } else {
            size = p.calcLayoutLinear();
        }
        return size;
    };

    p.calcLayoutLinear = function () {
        return [viz.body().height() * 0.8, viz.body().width() * 0.8];
    };

    p.computeData = function (opts) {
        if (opts.remove) {
            p.data = {};
        }
        p.data = viz.data()[0].values[0];
    };

    p.drawTree = function () {
        var nodes,
            links;

        if (p.config.verticalTree) {
            nodes = p.tree.nodes(p.data);
        } else {
            nodes = p.tree.nodes(p.data).reverse();
        }

        links = p.tree.links(nodes);

        p.drawNode.call(this, nodes, p.data);
        p.drawLink.call(this, links, p.data);
    };

    p.drawLink = function (links, root) {
	// Declare the links
        var link = d3.select(this).selectAll("path.link")
            .data(links, function(d) { return d.target.id; });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr('d', function (d) {
                var o = {x: root.x0, y: root.y0};
                return p.config.layoutOpts.linkPathGenerator({source: o, target: o});
            })
            .style('stroke', function (d) {
                return d.color || p.config.linkStyle.stroke;
            })
            .style('stroke-width', function (d) {
                return p.config.linkStyle.strokeWidth;
            })
            .style('fill', 'none');

        // Transition links to their new position.
        link.transition()
            .duration(viz.animation().duration)
            .attr("d", p.config.layoutOpts.linkPathGenerator);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(viz.animation().duration)
            .attr('d', function (d) {
                var o = {x: root.x, y: root.y};
                return p.config.layoutOpts.linkPathGenerator({source: o, target: o});
            })
            .remove();
    };

    p.drawNode = function (nodes, root) {
        var node,
            nodeEnter,
            nodeUpdate,
            nodeExit;

        // Declare the nodes
        node = d3.select(this).selectAll("g.node")
            .data(nodes, function(d) {
                return d[p.config.nodeIdKey];
            });

        // Enter the nodes.
        nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) {
                if (p.config.verticalTree) {
                    return "translate(" + root.x0 + "," + root.y0 + ")";
                } else {
                    return "translate(" + root.y0 + "," + root.x0 + ")";
                }
            })
            .on("dblclick", p.onNodeDoubleClicked);

        nodeEnter.append("circle")
            .style('stroke', function (d) {
                return '#fff';
            })
            .style('stroke-width', p.config.nodeStyle.strokeWidth)
            .style('fill-opacity', p.config.nodeStyle.opacity)
            .attr("r", 1e-6);

        nodeEnter.append("text")
            .attr('dy', "4px")
            .attr('dx', function(d) {
                var radius = p.getNodeRadius(d);
                return (radius + 3) + 'px';
            })
            .attr("text-anchor", function(d) { return "start"; })
            .style("fill-opacity", 1e-6)
            .style('font', '4px sans-serif')
            .text(function (d) { return d[p.config.nodeDisplayKey] || ''; });

        // Transition nodes to their new position.
        nodeUpdate = node.transition()
            .duration(viz.animation().duration)
            .attr("transform", function(d) {
                if (p.config.verticalTree) {
                    return "translate(" + d.x + "," + d.y + ")";
                } else {
                    return "translate(" + d.y + "," + d.x + ")";
                }
            });

        nodeUpdate.select("circle")
            .attr('r', function (d) { return p.getNodeRadius(d); })
            .style('stroke', function (d) {
                var color = p.getNodeColor.apply(this, arguments);
                return d3.rgb(color).darker();
            })
            .style("fill", function(d) {
                var color = p.getNodeColor.apply(this, arguments);
                if (p.config.collapsible && d._children) {
                    color = p.config.nodeStyle.collapsedFillColor;
                }
                return color;
            });

        nodeUpdate.select("text")
            .style("fill-opacity", 1)
            .style('font', '10px sans-serif');

        // Transition exiting nodes to the parent's new position.
        nodeExit = node.exit().transition()
            .duration(viz.animation().duration)
            .attr("transform", function(d) {
                if (p.config.verticalTree) {
                    return "translate(" + root.x + "," + root.y + ")";
                } else {
                    return "translate(" + root.y + "," + root.x + ")";
                }
            })
            .remove();

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    };

    p.getNodeRadius = function (d) {
        var r;
        if (d[p.config.nodeSizeKey]) {
            r = d[p.config.nodeSizeKey];
        } else {
            r = p.config.nodeStyle.radius;
        }
        return r;
    };

    /**
     * On mouse move update the hovered node and relevant links style
     */
    p.onVizMouseMove = function (mouse){
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        p.updateTooltips(mouse, cps);

        if (mouse) {
            p.selection.selectAll('.sonic-tree.' + tree.id() + ' circle:not(.selected)')
                .style('fill', function (d) {
                    var color = p.getNodeColor.apply(this, arguments);
                    if (p.config.collapsible && d._children) {
                        color = p.config.nodeStyle.collapsedFillColor;
                    }
                    return p.isClosestPoint(d, cps) ? d3.rgb(color).brighter() : color;
                })
                .style('stroke', function (d) {
                    var color = p.getNodeColor.apply(this, arguments);
                    color = d3.rgb(color).darker();
                    return p.isClosestPoint(d, cps) ? d3.rgb(color).brighter() : color;
                })
                .attr('r', function (d) {
                    var radius = p.getNodeRadius(d);

                    return p.isClosestPoint(d, cps) ? radius +
                        p.config.nodeStyle.highlightRadiusGrowth : radius;
                });

            p.selection.selectAll('.sonic-tree.' + tree.id() + ' path')
                .style('stroke-width', function (d) {
                    var w = p.config.linkStyle.strokeWidth;
                    return ((cps.length > 0 && cps[0][p.config.nodeIdKey] === d.source[p.config.nodeIdKey] ||
                        (cps.length > 0 && cps[0][p.config.nodeIdKey] === d.target[p.config.nodeIdKey])) ? w +
                        p.config.linkStyle.highlightStrokeWidthGrowth :  w);
                });
        }

        return cps;
    };

    p.getNodeColor = function (d, i) {
        var color = d.color;
        if (!color) {
            if (p.config.nodeStyle.colorBy === 'depth') {
                color = p.config.nodeStyle.nodeColors(d.depth);
            } else {
                color = p.config.nodeStyle.nodeColors(d.group);
            }
        }

        if (sonic.svg.hasClass(this, 'selected')) {
            color = d3.rgb(color).darker().toString();
        }
        return color;
    };

    p.closestPoints = function (mouse) {
        var radius,
            cps = p.getClosestPoints(p.data, mouse);

        radius = p.getNodeRadius(cps[0]);

        if (cps[1] < radius) {
            return cps;
        }
        return [];
    };

    p.isClosestPoint = function (d, cps) {
        var isClosest = false;

        cps.forEach(function (c) {
            if (c && c[p.config.nodeIdKey] === d[p.config.nodeIdKey]) {
                isClosest = true;
            }
        });

        return isClosest;
    };

    p.getClosestPoints = function (d, mouse) {
        var dist, cps;

        if (p.config.verticalTree) {
            dist = Math.sqrt(Math.pow(mouse[0] - d.x, 2) + Math.pow(mouse[1] - d.y, 2));
        } else {
            dist = Math.sqrt(Math.pow(mouse[0] - d.y, 2) + Math.pow(mouse[1] - d.x, 2));
        }

        cps = [d, dist];
        if (d.children) {
            d.children.forEach(function (c) {
                var cDist = p.getClosestPoints(c, mouse);
                if (cDist[1] < cps[1]) {
                    cps = cDist;
                }
            });
        }

        return cps;
    };

    p.onNodeDoubleClicked = function (d) {
        if (p.config.collapsible && d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            viz.update();
        }
    };

    /**
     * Handles clicking on a node.
     */
    p.onVizClick = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        p.selection.selectAll('.sonic-tree.' + tree.id() + ' circle')
            .classed('selected', function (d, i) {
                return p.isClosestPoint(d, cps);
            })
            .style('fill', function (d) {
                var color = p.getNodeColor.apply(this, arguments);
                if (p.config.collapsible && d._children) {
                    color = p.config.nodeStyle.collapsedFillColor;
                }
                return color;
            })
            .style('stroke', function (d) {
                return d3.rgb(p.getNodeColor.apply(this, arguments)).darker();
            });

        return cps;
    };

    /**
     * Update tooltips
     */
    p.updateTooltips = function (mouse, cps) {
        var renderFn = p.config.tooltip.renderFn || p.renderTooltips;

        if (p.config.tooltip) {
            if (mouse && cps.length > 0) {
                p.config.tooltip.closestPoints = cps;
                p.config.tooltip.content = renderFn(cps, mouse);
                p.config.tooltip.associatedId = tree.id();
                p.config.tooltip.mouse = mouse;

                viz.showTooltip(p.config.tooltip);
            } else {
                viz.hideTooltip(p.config.tooltip);
            }
        }
    };

    /**
     * Render nodes and links by default
     */
    p.config.tooltip.renderFn = function (cps) {
        var content = '',
            nodeName,
            children;
        nodeName = cps[0].name;
        children = cps[0].children || [];
        content = '<p><b>' + nodeName + ':</b><br/>' +
            '<b>Children:</b><br/>';
        children.forEach(function (cp) {
            nodeName = cp.name;
            content = content +
                '<b>' + nodeName + '</b><br/>';
        });

        return content;
    };

    sonic.augment(tree, p, viz, 'registerable', 'listenable');

    tree.mergeConfig(initialConfig);

    viz.register('sonic-tree', tree);

    return tree;
};

function sonic_tree_add (v, c) {
    v.body().call(sonic.tree(v, c));
}

function sonic_tree_remove (v, c) {
    v.remove('sonic-tree', c);
}

function sonic_tree_update(v, p, c) {
    v.find('sonic-tree', p).forEach(function (cmp) {
        cmp.mergeConfig(c);
        cmp.update();
    });
}

sonic_api.add('addTree', sonic_tree_add);
sonic_api.add('updateTree', sonic_tree_update);
sonic_api.add('removeTree', sonic_tree_remove);

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
sonic.line = function (viz, initialConfig) {
    var p = {
        xScale: null, //xScale for line
        yScale: null, //yScale for line
        defaultColors: sonic.colors.colorMap(), //default colors
        colors: [], //current colors
        config: {
            /**
             *  Unique id for this set of bars
             *  Note: A unique id will be generated by framework - this is
             *  just useful for a way to get the bars by an id that you know
             */
            id: null,
            /**
             * Set of css classes to add to the bars
             */
            cls: '',
            /**
             * The field that makes each data point unique
             */
            definedDataKey: 'id',
            /**
             * The field that each data point uses for its x-axis value
             */
            xDataKey: 'x',
            /**
             * The field that each data point uses for its y-axis value
             */
            yDataKey: 'y',
            /**
             * Which scale (by id) to use for the x-axis.  Can be passed in, otherwise
             * auto-generated based on xDataKey
             */
            xScaleId: null,
            /**
             * Which scale (by id) to use for the y-axis.  Can be passed in, otherwise
             * auto-generated based on yDataKey
             */
            yScaleId: null,
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
             * Stroke color
             *
             * Note: Will use series colors instead from data if they are defined
             * Note 2: If multiple lines, and no series colors, will use the default
             * color list.
             * @todo should rethink what rules for color should be (you may want
             * the same color for multiple lines)
             */
            stroke: 'black',
            /**
             * Fill color
             *
             * Note: Will use series colors instead from data if they are defined
             * Note 2: If multiple lines, and no series colors, will use the default
             * color list.
             * @todo should rethink what rules for color should be (you may want
             * the same color for multiple lines)
             */
            fill: 'black',
            /** Stroke width */
            strokeWidth: 3,
            /** Fill opacity */
            fillOpacity: 1,
            /** Whether to show a circle at every point along the line */
            showPoints: false,
            /** Whether to show a circle as the line is hovered over */
            showPointTracer: true,
            /** Radius of the point circles*/
            pointSize: 4,
            /** Radius of the point circles, when highlighted/selected */
            highlightPointSize: 6,
            /**
             * If too many points, and showPoints enabled, forcibly don't show
             * the circles since there are too many to see clearly
             */
            minPixelsPerPoint: 20,
            /**
             * Whether to sort the data before rendering
             */
            sort: false,
            /** Tooltip config */
            tooltip: {
                /**
                 * Only show the tooltip if closest point is within a certain
                 * buffer area - can be by value, or by pixel
                 */
                buffer: {
                    type: 'value', //or pixel
                    amount: null //value, or px amount
                },
                type: 'grouped', //todo implement single (1 per line)
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
     * Line constructor renders the lines/points
     *
     * @param {d3.selection} sel where to render the lines to
     * @param {Object} opts extra information on how to render the lines
     *   generally used to specify custom transitions
     */
    function line(sel, opts) {
        var classes = [p.config.cls, 'sonic-line'],
            groups;

        //update this line instance's selection to match the current one
        p.selection = sel;

        p.computeData(opts || {});
        p.setScales();
        p.computeColors();

        //group for each series
        //@todo should this by defined explicitly by key?
        groups = sel.selectAll('.sonic-line.' + p.config.id)
            .data(p.data);

        //create groups for any new series
        groups.enter().append('g')
            .classed('sonic-line ' + p.config.id, true)
            .append('path')
                .attr('stroke-width', p.config.strokeWidth)
                .attr('fill-opacity', 0);

        //update the color for existing groups
        groups
            .attr('stroke', function (d, i) {
                return p.colors[i];
            })
            .attr('fill', function (d, i) {
                return p.colors[i];
            });

        //draw lines/points/tracer points for each series
        groups.each(p.drawLine);
        groups.each(p.drawPoints);
        groups.each(p.drawTracerPoint);
        groups.each(p.setupLegend);

        //remove old lines
        groups.exit().remove();

        //Since we just tried to draw a line, we ask the viz to check
        //for content to appropriately update its no data message
        viz.registerVisibleContent(line, line.hasContent());
    }

    /**
     * Compute this instance's data from the viz data, using the passed
     * in series keys or indexes
     */
    p.computeData = function (opts) {
        p.data = [];
        if (opts.remove) {
            return;
        }
        //We filter out series with empty values because they will break the
        //line generator and would draw nothing anyways
        p.data = viz
                .dataBySeries(p.config.seriesKeys, p.config.seriesIndexes)
                .filter(function (d, i) {
                    if (d.values.length > 0) {
                        return true;
                    }
                });
    };

    /**
     * Sets the x and y scales for this instance  If an actual scale
     * passed in, uses that.  If a scale id passed in, use it,
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
                p.config.yScaleId = p.yScale.id();
            }
        }
    };

    /**
     * Compute the line colors
     *
     * If 1 line, use series color, or stroke color from config
     * If multiple lines, use series colors, or default colors
     *
     * @todo allow multiple lines to have same color based on config
     * @todo this needs to be cleaned up
     */
    p.computeColors = function () {
        p.data.forEach(function (d, i, arr) {
            if (arr.length > 1) {
                //if more than 1 line, use default color list as backup
                p.colors[i] = d.color || p.defaultColors(i);
            } else {
                //if only 1 line, use config stroke as backup
                p.colors[i] = d.color || p.config.stroke;
            }
        });
    };

    p.lineGenerator = function () {
        return d3.svg.line()
            .defined(function (d) {
                return sonic.isSet(d[p.config.definedDataKey]);
            })
            .x(function (d) {
                return p.xScale.position(d[p.config.xDataKey], 'center');
            })
            .y(function (d) {
                return p.yScale.position(d[p.config.yDataKey], 'center');
            });
    };

    p.setupLegend = function (series, i) {
        d3.select(this).selectAll('path')
            .attr(line.id() + '-data-legend', function (s) {
                return series.name || series.key;
            });
    };

    /**
     * Draw line for the given series
     */
    p.drawLine = function (series, i) {
        var lineGen = p.lineGenerator();

        d3.select(this).selectAll('path')
            .data(p.data).transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('d', function (d) {
                var vals = series.values;
                if (p.config.sort) {
                    vals = p.xScale.sort(vals);
                }
                return lineGen(vals);
            });
    };

    /**
     * Draw points for the given line series
     */
    p.drawPoints = function (series, i) {
        var dat = [],
            points;

        //if showPoints is true and there's enough space for them, set
        //the data to the series values, otherwise, leave empty so any
        //existing points go away
        if (p.config.showPoints &&
                p.config.minPixelsPerPoint < (viz.body().width() / series.values.length)) {

            dat = series.values;
        }

        points = d3.select(this).selectAll('circle.line-point')
            .data(dat);

        points.enter().append('circle')
            .classed(p.config.id + ' line-point', true)
            .attr('fill-opacity', p.config.fillOpacity);

        points.transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('cx', function (d) {
                return p.xScale.position(d[p.config.xDataKey], 'center');
            })
            .attr('cy', function (d) {
                return p.yScale.position(d[p.config.yDataKey], 'center');
            })
            .attr('r', p.config.pointSize);

        points.exit().remove();
    };

    /**
     * Draw a tracer point for the given series
     *
     * Actually adds two points, one for the hover
     * and one for the click
     */
    p.drawTracerPoint = function (series, i) {
        var dat = [],
            points;

        //if tracer desired, add 1 for both hover/click, otherwise
        //leave empty so existing ones are removed
        if (p.config.showPointTracer === true) {
            dat.push(
                {
                    type: 'mouse'
                },
                {
                    type: 'click'
                }
            );
        } else if (p.config.showTracerPoint !== false) {
            dat.push(
                {
                    type: p.config.showPointTracer
                }
            );
        }

        points = d3.select(this).selectAll('circle.tracer-point')
            .data(dat);

        points.enter().append('circle')
            .attr('class', function (d) {
                return p.config.id + ' ' + series.key +
                    ' tracer-point ' + d.type;
            })
            .attr('fill-opacity', 0.8)
            .attr('opacity', 0)
            .attr('r', p.config.highlightPointSize);

        points
            .attr('cx', function (d, i) {
                var cpId = this.getAttribute('cpId'),
                    pos = 0,
                    matches = [];

                //find x position to show point by using the point's
                //id, and then looking through the values to find that
                //point's x value
                if (cpId) {
                    matches = series.values.filter(function (dp) {
                        return sonic.isDate(dp.id) ?
                                (dp.id.getTime().toString() === cpId) : (dp.id.toString() === cpId);
                    });

                    if (matches.length > 0) {
                        pos = p.getPositionFromCP([{point: matches[0]}], 0)[0];
                    }
                }

                return pos;
            })
            .attr('cy', function (d, i) {
                var cpId = this.getAttribute('cpId'),
                    pos = 0,
                    matches = [];

                //find y position to show point by using the point's
                //id, and then looking through the values to find that
                //point's x value
                if (cpId) {
                    matches = series.values.filter(function (dp) {
                        return sonic.isDate(dp.id) ?
                                (dp.id.getTime().toString() === cpId) : (dp.id.toString() === cpId);
                    });

                    if (matches.length > 0) {
                        pos = p.getPositionFromCP([{point: matches[0]}], 0)[1];
                    }
                }

                return pos;
            });

        points.exit().remove();
    };

    /**
     * On viz mouse move, find closest points
     * and update tooltips accordingly
     */
    p.onVizMouseMove = function (mouse) {
        var cps = [];

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        p.updateTooltips(mouse, cps);

        //only update non-selected points so selected ones
        //stay highlighted
        d3.selectAll('.' + line.id() + '.tracer-point.mouse')
            .attr('cx', function (d, i) {
                var pos = p.getPositionFromCP(cps, i);
                return pos ? pos[0] : 0;
            })
            .attr('cy', function (d, i) {
                var pos = p.getPositionFromCP(cps, i);
                return pos ? pos[1] : 0;
            })
            .attr('opacity', function (d, i) {
                return (mouse && p.getPositionFromCP(cps, i)) ? 1 : 0;
            })
            .attr('stroke', function (d, i) {
                return (cps && cps[i]) ? cps[i].color : null;
            })
            .attr('fill', function (d, i) {
                return (cps && cps[i]) ? cps[i].color : null;
            });

        return cps;
    };

    /*
     * On viz mouse click, find closest points,
     * update tracer to put the click tracer there,
     * and then return them
     */
    p.onVizClick = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        //hide hover circle when click happens because it's distracting
        d3.selectAll('.' + line.id() + '.tracer-point.mouse')
            .attr('opacity', 0);

        d3.selectAll('.' + line.id() + '.tracer-point.click')
            .attr('cx', function (d, i) {
                var pos = p.getPositionFromCP(cps, i);
                return pos ? pos[0] : 0;
            })
            .attr('cy', function (d, i) {
                var pos = p.getPositionFromCP(cps, i);
                return pos ? pos[1] : 0;
            })
            .attr('cpId', function (d, i) {
                //set the point's id so that the tracer can use it later
                //to figure out it's x/y values
                var id = null;
                if (cps && cps.length > 0 && cps[i]) {
                    //@todo this check shouldn't need to happen...should use
                    //scale or something
                    id = sonic.isDate(cps[i].point.id) ? cps[i].point.id.getTime() : cps[i].point.id;
                }
                return id;
            })
            .attr('opacity', function (d, i) {
                //if clicked, show...if clickout, don't show
                return (mouse && p.getPositionFromCP(cps, i)) ? 1 : 0;
            });

        return cps;
    };

    /**
     * Find closest points to mouse.
     * Note changes: will only be a valid closestPoint if within the yScale of the viz.
     */
    p.closestPoints = function (mouse) {
        var cps = [],
            inRange,
            noConfig,
            x = mouse[0],
            y = mouse[1],
            cpDist = null;

        if(p.config.tooltip && sonic.isSet(p.config.tooltip.buffer.value) === true) {
            inRange = (y >= p.yScale.rangeMin() && y <= p.yScale.rangeMax());
            if (inRange === false) {
                return [];
            }
        } else {
            noConfig = true;
        }

        if (inRange || noConfig) {

            cps = p.data.map(function (d) {
                var cp = {
                    xDist: null,
                    point: null
                };

                sonic.each(d, function (k, v) {
                    if (k !== 'values') {
                        cp[k] = v;
                    }
                });

                return cp;
            });

            p.data.forEach(function (d, i) {
                d.values.forEach(function (v) {
                    var xDist = Math.abs(p.xScale.position(v[p.config.xDataKey], 'center') - x),
                        yDist = Math.abs(p.yScale.position(v[p.config.yDataKey], 'center') - y);

                    if (!cps[i].point || xDist < cps[i].xDist) {
                        //check to make sure point is within buffer before
                        //considering it actually a close point
                        if (p.pointWithinBuffer(v, xDist)) {
                            cps[i].point = v;
                            cps[i].xDist = xDist;
                            cps[i].yDist = yDist;
                        }
                    }
                });
            });

            //if no closest points in a series, don't return that series
            cps = cps.filter(function (d) {
                return (sonic.isSet(d.point)) ? true : false;
            });

            return cps;
        }
    };

    /**
     * Update tooltips
     */
    p.updateTooltips = function (mouse, cps) {
        var renderFn;

        if (p.config.tooltip) {
            renderFn = p.config.tooltip.renderFn || p.renderTooltips;
            p.config.tooltip.associatedId = line.id();
            if (mouse) {
                if (cps.length > 0) {
                    p.config.tooltip.closestPoints = cps;
                    p.config.tooltip.content = renderFn(cps, mouse);
                    p.config.tooltip.mouse = mouse;
                    viz.showTooltip(p.config.tooltip);
                } else {
                    viz.removeTooltip(p.config.tooltip);
                }
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
                '<b>' + p.config.yDataKey + ':</b>' + cp.point[p.config.yDataKey];

            return html + '</p>';
        }).reduce(function (last, curr) {
            return last + curr;
        });
    };

    /**
     * Is the point, alongside its px distance within the buffer?
     *
     * Can use value, or pixel as buffer
     */
    p.pointWithinBuffer = function (point, pxDistance) {
        var withinBuffer = true;

        if (p.config.tooltip && sonic.isSet(p.config.tooltip.buffer.amount)) {
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

    /**
     * Get x/y position for a given closest point passed in
     */
    p.getPositionFromCP = function (cps, i) {
        return (cps && cps.length > 0 && cps[i]) ? [
            p.xScale.position(cps[i].point[p.config.xDataKey], 'center'),
            p.yScale.position(cps[i].point[p.config.yDataKey])
        ] : null;
    };

    /**
     * Is the current point one of the closest points that has been
     * identified elsewhere
     */
    p.isClosestPoint = function (type, d, closestPoints) {
        if (!sonic.isArray(closestPoints)) {
            return false;
        }

        return closestPoints.filter(function (cp) {
            return cp.key === type &&
                cp.point[p.config.definedDataKey] === d[p.config.definedDataKey];
        }).length > 0;
    };

    /**
     * Get line point radius based on config and whether the point
     * is currently highlighted
     */
    p.getLinePointRadius = function (d, i, closestPoints) {
        var groupKey = d3.select(this.parentNode).data()[0].key,
            size = p.config.pointSize;

        if (sonic.isSet(closestPoints) &&
                p.isClosestPoint(groupKey, d, closestPoints)) {
            size = p.config.highlightPointSize;
        }

        return size;
    };

    sonic.augment(line, p, viz, 'registerable', 'listenable');
    //merge config
    line.mergeConfig(initialConfig);
    //register this line
    viz.register('sonic-line', line);

    return line;
};

/**
 * Add a line(s) to the viz body
 */
function sonic_line_add (v, c) {
    v.body().call(sonic.line(v, c));
}


/**
 * Remove a line from the viz body
 */
function sonic_line_remove (v, c) {
    v.remove('sonic-line', c);
}


/**
 * Update matching lines in viz v, based on params p,
 * to have config c
 */
function sonic_line_update (v, p, c) {
    v.find('sonic-line', p).forEach(function (cmp) {
        cmp.mergeConfig(c);
        cmp.update();
    });
}

/* Public API Methods */
sonic_api.add('addLine', sonic_line_add);
sonic_api.add('addLines', sonic_line_add);
sonic_api.add('updateLine', sonic_line_update);
sonic_api.add('updateLines', sonic_line_update);
sonic_api.add('removeLine', sonic_line_remove);
sonic_api.add('removeLines', sonic_line_remove);

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

sonic.line.rule = function (viz, initialConfig) {
    var p = {
        config: {
            /**
             *  Unique id for this rule
             *  Note: A unique id will be generated by framework - this is
             *  just useful for a way to get the bars by an id that you know
             */
            id: null,
            /**
             * Set of css classes to add to the rule
             */
            cls: '',
            /**
             * If user wants to pin rule to a value, must provide the axis id
             * x or y value.
             *
             * Must be of the same axis type. For ex: type "time" means that the
             * value of x or y needs to be a date object.
             */
            axisPin: {
                id: null,
                x: null,
                y: null
            },
            /**
             * Controls the line. If dashed, show = true. Stroke
             * config allows user to determine spacing of the line. "3, 3" translates
             * to 3 pixels on and 3 pixels off.
             */
            dashed: {
                show: false,
                stroke: '3,3'
            },
            stroke: 'grey',
            strokeWidth: 1,
            position: null,
            type: null,
            length: null,
            //@todo: create offset for x and y direction.
            offset: {
                length: 0
            },
            followMouse: false
        }
    };

    /**
     * Bar constructor renders the rules
     *
     * @param {d3.selection} sel where to render the bars to
     * @param {Object} opts extra information on how to render the bars
     *   generally used to specify custom transitions
     */
    function rule(sel, opts) {
        var classes = [p.config.cls, 'sonic-rule'],
            groups,
            paths,
            scale;

        //update this bar instance's selection to match the current one
        p.selection = sel;
        opts = opts || {};

        if (sonic.isSet(p.config.axisPin.id)) {
            scale = viz.componentSingleton().find('sonic-axis', p.config.axisPin.id)[0].scale();
        }

        p.computeData(opts, scale);

        groups = sel.selectAll('.sonic-rule.' + rule.id())
            .data(p.data, function() {
                return rule.id();
            });

        groups.enter().append('g')
            .classed('sonic-rule ' + rule.id() + ' ' + p.config.type, true)
            .classed('mouse', function (d) {
                return p.config.followMouse;
            })
            .attr('stroke', p.config.stroke)
            .append('path')
                .attr('stroke-width', p.config.strokeWidth)
                .attr('opacity', function (d, i) {
                return d[0].enabled ? 1 : 0;
            });

        groups.each(p.drawRule);

        groups.exit().remove();

        //we never want to tell the viz we have rendered content
        //because we shouldn't impact the no data message
        viz.registerVisibleContent(rule, false);
    }

    p.drawRule = function (series, i) {
        var line = d3.svg.line()
            .x(function (d) { return d.x; })
            .y(function (d) { return d.y; }),
            rule,
            delay = viz.animation().delay,
            duration = viz.animation().duration;

        if (p.config.followMouse) {
            delay = 0;
            duration = 0;
        } else if (p.config.animation) {
            delay = sonic.isSet(p.config.animation.delay) ? p.config.animation.delay : delay;
            duration = sonic.isSet(p.config.animation.duration) ? p.config.animation.duration : duration;
        }

        rule = d3.select(this).select('path')
                .transition()
                .delay(delay)
                .duration(duration)
                .attr('d', line);

        if (p.config.dashed.show) {
            rule = rule.style('stroke-dasharray', p.config.dashed.stroke);
        }
    };

    p.computeData = function (opts, scale) {
        var pos = p.config.position,
            enabled = true,
            length,
            offset,
            yVal = pos * viz.body().height(),
            xVal = pos * viz.body().width();

        p.data = [];

        if (opts.remove) {
            return;
        }

        //if no position passed in, assume that this is
        //disabled and going to be set later (either by
        //following mouse or something else)
        if (!sonic.isSet(pos) && !sonic.isSet(p.config.axisPin.x) && !sonic.isSet(p.config.axisPin.y)) {
            enabled = false;
            pos = 0;
        }

        if (p.config.type === 'x') {
            if (p.config.length) {
                length = p.config.length;
            } else {
                length = viz.body().width();
                if (p.config.offset.anchor === 'right') {
                    length = -1 * length;
                }
            }

            offset = p.config.offset.length;
            if (p.config.offset.anchor === 'right') {
                offset = offset + viz.body().width();
            }

            if (sonic.isSet(p.config.axisPin.y)) {
                yVal = scale.position(p.config.axisPin.y);
            }

            p.data.push([
                {
                    x: offset,
                    y: yVal,
                    enabled: enabled
                },
                {
                    x: length + offset,
                    y: yVal,
                    enabled: enabled
                }
            ]);
        } else if (p.config.type === 'y') {
            if (p.config.length) {
                length = p.config.length;
            } else {
                length = -1 * viz.body().height();
                if (p.config.offset.anchor === 'top') {
                    length = length * -1;
                }
            }

            offset = viz.body().height() + p.config.offset.length;
            if (p.config.offset.anchor === 'top') {
                offset = p.config.offset.length;
            }

            if (sonic.isSet(p.config.axisPin.x)) {
                xVal = scale.position(p.config.axisPin.x);
            }

            p.data.push([
                {
                    x: xVal + ((p.config.offset && p.config.offset.x) ? p.config.offset.x : 0),
                    y: offset,
                    enabled: enabled
                },
                {
                    x: xVal + ((p.config.offset && p.config.offset.x) ? p.config.offset.x : 0),
                    y: length + offset,
                    enabled: enabled
                }
            ]);
        }
    };

    p.onVizMouseMove = function (mouse) {
        if (mouse) {
            d3.select('.sonic-rule.' + rule.id() + '.mouse.x' + ' path')
                .attr('opacity', 1)
                .attr('transform', function (d) {
                    return 'translate(0 , ' + mouse[1] + ')';
                });
            d3.select('.sonic-rule.' + rule.id() + '.mouse.y' + ' path')
                .attr('opacity', 1)
                .attr('transform', function (d) {
                    return 'translate(' + mouse[0] + ', 0)';
                });
        } else {
            d3.select('.sonic-rule.' + rule.id() + '.mouse' + ' path')
                .attr('opacity', 0);
        }
    };

    sonic.augment(rule, p, viz, 'registerable', 'listenable');
    rule.mergeConfig(initialConfig);
    viz.register('sonic-rule', rule);

    return rule;
};

//add new rule instance
function sonic_line_rule_add (v, c) {
    v.body().call(sonic.line.rule(v, c));
}

function sonic_line_rule_remove (v, p) {
    v.remove('sonic-rule', p);
}

//add crosshairs for mouseover
//In future maybe we pass in extra config so we can
//handle distinct passed config for x and y
function sonic_line_rule_add_crosshair (v, c) {
    sonic_line_rule_add(v, sonic.object.merge(
        {
            type: 'x',
            followMouse: true,
            stroke: '#4CC417'
        },
        c
    ));

    sonic_line_rule_add(v, sonic.object.merge(
        {
            type: 'y',
            followMouse: true,
            stroke: '#4CC417'
        },
        c
    ));
}

function sonic_line_rule_update (v, p, c) {
    v.find('sonic-rule', p).forEach(function (cmp) {
        cmp.mergeConfig(c);
        cmp.update();
    });
}

sonic_api.add('addRule', sonic_line_rule_add);
sonic_api.add('removeRule', sonic_line_rule_remove);
sonic_api.add('updateRule', sonic_line_rule_update);
sonic_api.add('addCrosshair', sonic_line_rule_add_crosshair);

sonic.bar = function (viz, initialConfig) {
    var p = {
        xScale: null,
        yScale: null,
        barGroupWidth: null,
        barWidth: null,
        groupIndex: null,
        defaultColors: sonic.colors.colorMap(),
        config: {
            /** Type of bar chart, grouped or stacked */
            type: 'grouped',
            /**
             *  Unique id for this set of bars
             *  Note: A unique id will be generated by framework - this is
             *  just useful for a way to get the bars by an id that you know
             */
            id: null,
            /**
             * Set of css classes to add to the bars
             */
            cls: '',
            /**
             * The field that makes each data point unique
             */
            definedDataKey: 'id',
            /**
             * The field that each data point uses for its x-axis value
             */
            xDataKey: 'x',
            /**
             * The field that each data point uses for its y-axis value
             */
            yDataKey: 'y',
            labelKey: 'label',
            /**
             * Which scale (by id) to use for the x-axis.  Can be passed in, otherwise
             * auto-generated based on xDataKey
             */
            xScaleId: null,
            /**
             * Which scale (by id) to use for the y-axis.  Can be passed in, otherwise
             * auto-generated based on yDataKey
             */
            yScaleId: null,
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
             * Stroke color
             * Note: Will use series colors instead from data if they are defined
             */
            stroke: 'black',
            /**
             * Fill color
             * Note: Will use series colors instead from data if they are defined
             */
            fill: '',
            /**
             * Controls animation of bars. Duration controls how long it takes to update
             * a bar. Delay when null will update left --> right, otherwise it will update all
             * at once.
             */
            animation: {
                duration: null,
                delay: null
            },
            /** Stroke (border) width */
            strokeWidth: 1,
            /** Fill opacity */
            fillOpacity: 1,
            /** bar position */
            barPosition: 'center',
            /** Minimum bar width */
            minBarWidth: 8,
            /** Maximum bar width */
            maxBarWidth: 50,
            /** Manually set bar width */
            barWidth: null,
            /**
             * Padding between bars in bar groups
             */
            barPadding: 0,
            /**
             * Padding between bar groups
             */
            barGroupPadding: 5,
            /** Whether to highlight bars when hovering */
            highlightOnHover: true,
            drawLabels: false,
            labelStyle: {
                fontSize: 10,
                fontFamily: 'arial',
                fill: null,
                stroke: 'none',
                anchor: 'middle'
            },
            /** Tooltip config */
            tooltip: {
                type: 'grouped', //grouped or single. @todo implement single for stacked bars
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
     * Bar constructor renders the bars
     *
     * @param {d3.selection} sel where to render the bars to
     * @param {Object} opts extra information on how to render the bars
     *   generally used to specify custom transitions
     */
    function bar(sel, opts) {
        var classes = [p.config.cls, 'sonic-bar'],
            groups,
            groupAction,
            delay,
            duration;

        //update this bar instance's selection to match the current one
        p.selection = sel;

        p.computeData(opts || {});
        p.setScales();
        p.computeBarWidth();

        //groups are by series key
        groups = sel.selectAll(classes.join('.') + '.' + bar.id())
            .data(p.data, function (s) {
                return s.key;
            });

        //create groups for any new series
        //give them their color
        groups.enter().append('g')
            .classed(classes.join(' ') + ' ' + bar.id(), true);

        delay = sonic.isSet(p.config.animation.delay) ? p.config.animation.delay : viz.animation().delay;
        duration = sonic.isSet(p.config.animation.duration) ? p.config.animation.duration : viz.animation().duration;


        if (delay > 0 || duration > 0) {
            groupAction = groups.transition().delay(delay).duration(duration);
        } else {
            groupAction = groups;
        }

        groupAction
            .attr('stroke', function (d, i) {
                return d3.rgb(p.getBarColor(d, i)).darker().toString();
            })
            .attr('fill', p.getBarColor);

        //for each group, draw bars
        groups.each(function (d, i) {
            p.drawBars.call(this, d, i, opts || {});
        });

        groups.each(p.setupLegend);

        //remove old series
        groups.exit().remove();

        //Since we attempted to draw bars, we alert the viz
        //if we were successful or not
        viz.registerVisibleContent(bar, bar.hasContent());
    }

    /**
     * Compute the data based off viz.data() array
     */
    p.computeData = function (opts) {
        p.data = [];
        if (opts.remove) {
            return;
        }
        p.data = viz.dataBySeries(p.config.seriesKeys, p.config.seriesIndexes);
        p.groupIndex = {};

        if (p.data.length === 0) {
            return;
        }

        //keep track of what bar groups there are since the
        //data itself is grouped by series, not bar group
        p.data.forEach(function (s) {
            s.values.forEach(function (d) {
                if (!p.groupIndex[d[p.config.xDataKey]]) {
                    p.groupIndex[d[p.config.xDataKey]] = [];
                }

                if (p.groupIndex[d[p.config.xDataKey]].indexOf(s.key) === -1) {
                    p.groupIndex[d[p.config.xDataKey]].push(s.key);
                }
            });
        });

        if (p.config.type === 'stacked') {
            p.computeStackedData();
        }
    };

    /**
     * Compute the data for a stacked bar chart, which basically adds a
     * y0 value onto each data point.  Because of this, make sure to
     * clone viz.data() since using stack is destructive
     *
     * Stack layout expects equal number of values per series, so this
     * "fills in" the values arrays for each series so the length is equal.
     * Each point has a value of 0, and a filler=true variable so that it
     * can be ignored in other parts of this code. It also expects the
     * values array to be sorted the same way between series
     *
     * Note: Requires computeData to be called first
     */
    p.computeStackedData = function () {
        var stack = d3.layout.stack()
            .values(function (d) {
                return d.values;
            })
            .x(function (d) { return d[p.config.xDataKey]; })
            .y(function (d) { return d[p.config.yDataKey]; });

        //fill in values arrays & sort for each series to be same
        //length before stack
        p.data = sonic.clone(p.data).map(function (s) {
            d3.keys(p.groupIndex).forEach(function (k) {
                var key = k,
                    pt = {};

                if (sonic.string.isNumeric(key)) {
                    key = parseInt(key, 10);
                }

                if (!s.values.some(function (di) {
                        if (sonic.isDate(di[p.config.xDataKey])) {
                            if (!sonic.isDate(key)) {
                                key = new Date(key);
                            }
                            return di[p.config.xDataKey].getTime() === key.getTime() ? true : false;
                        }
                        return di[p.config.xDataKey] === key ? true : false;
                    })) {

                    pt[p.config.xDataKey] = key;
                    pt[p.config.yDataKey] = 0;
                    pt.filler = true;
                    s.values.push(pt);
                }
            });

            s.values.sort(function (a, b) {
                return a[p.config.xDataKey] < b[p.config.xDataKey] ? -1 : 1;
            });

            return s;
        });

        //do the stack
        p.data = stack(p.data);
    };

    /**
     * Sets the x and y scales for this instance  If an actual scale
     * passed in, uses that.  If a scale id passed in, use it,
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
                p.config.yScaleId = p.yScale.id();
            }
        }

        //since the stacked chart aggregates data points together, need
        //to update the scale/axis to fit the aggregate values
        if (p.config.type === 'stacked') {
            p.transitionAxisToStacked();
        } else {
            p.transitionAxisToGrouped();
        }
    };

    p.setupLegend = function (series, i) {
        d3.select(this).selectAll('rect')
            .attr(bar.id() + '-data-legend', function (s) {
                return series.name || series.key;
            })
            .attr('data-legend-color', function (s) {
                return series.color || series.stroke || s.color || s.stroke;
            });
    };

    /**
     * Draw the bars for each series
     *
     * @param {Object} series object
     * @param {Number} i index of series
     * @param {Object} opts Options for how to render the bars
     */
    p.drawBars = function (series, i, opts) {
        var bars,
            barsToUpdate,
            delay = p.getBarGroupDelay,
            duration = viz.animation().duration,
            barAction;

        //set up rects from data
        bars = d3.select(this).selectAll('rect')
            .data(
                function (d) {
                    return d.values;
                },
                function (d) {
                    return d[p.config.definedDataKey];
                }
            );

        //determines delay and duration values based on configs
        if (sonic.isSet(p.config.animation.delay)) {
            delay = p.config.animation.delay;
        }
        if (sonic.isSet(p.config.animation.duration)) {
            duration = p.config.animation.duration;
        }

        //add new bars, centered on x position
        //and height of 0 so hidden at bottom of viz
        bars.enter().append('rect')
            .attr('stroke-width', p.config.strokeWidth)
            .attr('fill-opacity', p.config.fillOpacity)
            .attr('x', p.getBarAlignment)
            .attr('width', p.barWidth)
            .attr('y', p.getBarInitY)
            .attr('height', 0)
            .attr('fill', p.getDataPointColor)
            .attr('stroke', p.getDataPointStrokeColor);

        if (delay > 0 || duration > 0) {
            barAction = bars.transition().delay(delay).duration(duration);
        } else {
            barAction = bars;
        }

        if (p.config.type === 'stacked') {
            //load bar groups from left to right and rise vertically
            //if animating from grouped, will set height and y first,
            //then x and width
            //checks for correct configuration of animation first
            barAction
                .attr('fill', p.getDataPointColor)
                .attr('stroke', p.getDataPointStrokeColor)
                .attr('stroke-width', p.config.strokeWidth)
                .attr('fill-opacity', p.config.fillOpacity)
                .attr('y', function (d) {
                    return p.yScale.position(d.y0 + d[p.config.yDataKey], 'center');
                })
                .attr('height', function (d) {
                    return p.yScale.position(d.y0) - p.yScale.position(d.y0 + d[p.config.yDataKey], 'center');
                })
                .transition()
                .attr('x', p.getBarAlignment)
                .attr('width', function (d) {
                    return p.barWidth;
                });

        } else {
            //load bar groups from left to right and fan out from center
            //to the correct bar offset
            //if animating from stacked, will set x and width first, then
            //height and y
            // checks for the correct animation configuration first
            barAction
                .attr('fill', p.getDataPointColor)
                .attr('stroke', p.getDataPointStrokeColor)
                .attr('stroke-width', p.config.strokeWidth)
                .attr('fill-opacity', p.config.fillOpacity)
                .attr('x', function (d, i) {
                    return p.getGroupedBarPosition(d, i, series.key);
                })
                .attr('width', p.barWidth)
                .transition()
                .attr('y', p.getGroupedBarY)
                .attr('height', p.getGroupedBarHeight);
        }

        //transition removed bars down to 0 height and remove
        // checks for the correct animation configuration

        if (!(sonic.isSet(p.config.animation.delay))) {
            delay = viz.animation().delay;
        }

        if (delay > 0 || viz.animation().duration > 0) {
            barAction = bars.exit().transition().delay(delay).duration(viz.animation().duration);
        } else {
            barAction = bars.exit();
        }

        //transition removed bars down to 0 height and remove
        barAction
            .attr('y', function (d) {
                return viz.body().height();
            })
            .attr('height', 0)
            .remove();

        if (p.config.drawLabels !== false) {
            p.drawLabels.call(this, series, i, opts);
        }
    };

    p.getLabelX = function (d, i, series) {
        var pos;

        pos = p.getGroupedBarPosition(d, i, series.key);
        if (p.config.barPosition === 'center' || p.config.barPosition === 'bin') {
            pos = pos + p.barWidth / 2;
        }

        return pos;
    };

    p.getLabelY = function (d, i, series) {
        var pos;

        if (p.config.drawLabels === 'top') {
            pos = p.getGroupedBarY.apply(this, arguments) - 5;
        } else {
            pos = p.getGroupedBarY.apply(this, arguments) + p.getGroupedBarHeight.apply(this, arguments) + 15;
        }

        return pos;
    };

    p.drawLabels = function (series, i, opts) {
        var labels,
            labelAction,
            delay = p.getBarGroupDelay,
            duration = viz.animation().duration;

        labels = d3.select(this).selectAll('.sonic-bar-label')
            .data(
                function (d) {
                    return d.values;
                },
                function (d) {
                    return d[p.config.definedDataKey];
                }
            );

        //determines delay and duration values based on configs
        if (sonic.isSet(p.config.animation.delay)) {
            delay = p.config.animation.delay;
        }
        if (sonic.isSet(p.config.animation.duration)) {
            duration = p.config.animation.duration;
        }

        labels.enter().append('text')
            .classed('sonic-bar-label', true)
            .attr('x', p.getBarAlignment)
            .attr('y', p.getBarInitY);

        if (delay > 0 || duration > 0) {
            labelAction = labels.transition().delay(delay).duration(duration);
        } else {
            labelAction = labels;
        }

        if (p.config.type === 'stacked') {
            //maybe implement, what does this even mean
        } else {
            labelAction
                .attr('x', function (d, i) { return p.getLabelX.call(this, d, i, series); })
                .attr('y', function (d, i) { return p.getLabelY.call(this, d, i, series); })
                .style('fill', p.config.labelStyle.fill)
                .style('stroke', 'none')
                .style('font-size', p.config.labelStyle.fontSize + 'px')
                .style('font-family', p.config.labelStyle.fontFamily)
                .style('text-anchor', p.config.labelStyle.anchor)
                .text(function (d) {
                    return d[p.config.labelKey];
                });

        }

        if (!(sonic.isSet(p.config.animation.delay))) {
            delay = viz.animation().delay;
        }

        if (delay > 0 || viz.animation().duration > 0) {
            labelAction = labels.exit().transition().delay(delay).duration(viz.animation().duration);
        } else {
            labelAction = labels.exit();
        }

        labelAction
            .attr('y', viz.body().height())
            .remove();

    };

    /**
     * Compute bar width
     */
    p.computeBarWidth = function () {
        var numSeries = p.data.length;

        //if ordinal, already have bar group, otherwise, compute
        if (p.xScale.type() === 'ordinal') {
            p.barGroupWidth = p.xScale.rangeBand();
        } else {
            if (sonic.isObject(p.config.barWidth)) {
                p.barGroupWidth = p.xScale.domainIntervalToRange(p.config.barWidth.amount);
            } else {
                p.barGroupWidth = Math.floor(p.xScale.rangeExtent() /
                    (sonic.array.maxLength(p.data) * numSeries));
            }
        }

        //give some bar group buffer
        p.barGroupWidth = p.barGroupWidth - p.config.barGroupPadding * 2;

        //if explicitly set, use it
        if (sonic.isSet(p.config.barWidth)) {
            if (sonic.isObject(p.config.barWidth)) {
                p.barWidth = p.xScale.domainIntervalToRange(p.config.barWidth.amount);
            } else {
                p.barWidth = p.config.barWidth;
            }
        } else if (p.config.type === 'stacked' || numSeries === 1) {
            //if stacked or 1 bar per group, set bar width to group width
            //otherwise, split up bar group
            p.barWidth = p.barGroupWidth;
        } else {
            p.barWidth = Math.floor((p.barGroupWidth -
                (numSeries * p.config.barPadding * 2)) / numSeries);
        }

        //todo this isn't quite right
        //also, what to do if barWidth is < 0?
        if (!sonic.isSet(p.config.barWidth)) {
            if (p.barWidth < p.config.minBarWidth) {
                p.barWidth = p.config.minBarWidth;
            } else if (p.barWidth > p.config.maxBarWidth) {
                p.barWidth = p.config.maxBarWidth;
            }
        }

        if (!sonic.isSet(p.config.tooltip.buffer)) {
            p.config.tooltip.buffer = {
                type: 'pixel',
                value: p.barWidth
            };
        }
    };

    /**
     * Get the current bar color
     *
     * Uses the series color if set, otherwise use default colors
     */
    p.getBarColor = function (d, i) {
        return d.color || p.config.fill || p.defaultColors(i);
    };

    /**
     * Get the current data point's color, otherwise returns undefined which
     * means it'll use the bar series color.
     */
    p.getDataPointColor = function (d, i) {
        return d.color || undefined;
    };

    /**
     * Get the current data point's highlight color, otherwise returns undefined which
     * means it'll use the bar series highlight color.
     */
    p.getDataPointStrokeColor = function (d, i) {
        if (d.stroke) {
            return d.stroke;
        } else if (d.color) {
            return d3.rgb(d.color).darker();
        } else {
            return undefined;
        }
    };

    /**
     * Given a datapoint returns the series it belongs to
     */
    p.getBarSeriesIdx = function (d) {
        var series = 0;
        p.data.forEach(function (s, i) {
            if (s.values.indexOf(d) >= 0) {
                series = i;
            }
        });
        return series;
    };

    /**
     * Get the animation delay for a specific bar group
     *
     * Current effect is that bar groups load from left to right
     */
    p.getBarGroupDelay = function (d, i) {
        var delay = 0,
            idx;

        if (sonic.isSet(p.groupIndex)) {
            idx = d3.keys(p.groupIndex).sort(function (a, b) {
                var aVal = sonic.string.isNumeric(a) ? parseInt(a, 10) : a,
                    bVal = sonic.string.isNumeric(b) ? parseInt(b, 10) : b;
                return p.xScale.position(aVal, p.config.barPosition) <
                    p.xScale.position(bVal, p.config.barPosition) ? -1 : 1;
            }).indexOf(String(d[p.config.xDataKey]));

            if (idx === -1) {
                delay = 0;
            } else {
                delay = idx * 200;
            }
        }

        return delay;
    };

    /**
     * Gets the alignment of the bar, offsets if position is centered
     * @TODO only supports center and left currently
     * also need to put the position adjustment inside the xScale.position function
     * based on the passed barPosition
     */
    p.getBarAlignment = function (d, i) {
        var pos = p.xScale.position(d[p.config.xDataKey], p.config.barPosition);
        if (p.config.barPosition === 'center') {
            pos = pos - p.barWidth / 2;
        }
        return pos;
    };

    /**
     * Get offset of bar within group
     */
    p.getGroupedBarPosition = function (d, i, sKey, location) {
        var gi = p.groupIndex[d[p.config.xDataKey]],
            idx = 0,
            pos = p.xScale.position(d[p.config.xDataKey], p.config.barPosition);

        if (sonic.isSet(gi)) {
            idx = gi.indexOf(sKey);

            if (idx !== -1) {
                pos += idx * (p.barWidth + p.config.barPadding * 2);
                if (p.config.barPosition === 'center') {
                    pos += (-1 * gi.length * (p.barWidth + p.config.barPadding) / 2);
                }
            }
        }

        if (location && location === 'center') {
            pos = pos + (p.barWidth + p.config.barPadding) / 2;
        } else if (location && location === 'max') {
            pos = pos + (p.barWidth + p.config.barPadding * 2);
        }

        return pos;
    };

    p.getGroupedBarY = function (d, i) {
        var baseline = d.y0,
            yVal = d[p.config.yDataKey];

        if (sonic.isSet(baseline)) {
            yVal = Math.max(yVal, baseline);
        }

        return p.yScale.position(yVal, p.config.barPosition);
    };

    p.getBarInitY = function (d, i) {
        var baseline = d.y0,
            yVal = viz.body().height();

        if (sonic.isSet(baseline) &&
                p.config.type === 'grouped') {
            yVal = p.yScale.position(d.y0, p.config.barPosition);
        }

        return yVal;
    };

    p.getGroupedBarHeight = function (d, i) {
        var baseline = d.y0,
            heightVal = viz.body().height(),
            yVal = d[p.config.yDataKey];

        if (sonic.isSet(baseline)) {
            heightVal = p.yScale.position(baseline, p.config.barPosition);
        }

        return Math.abs(p.yScale.position(d[p.config.yDataKey], p.config.barPosition) - heightVal);
    };

    /**
     * Transition axis to stacked
     *
     * Determines new domain max by looping through values
     * and adding y0 to y value
     */
    p.transitionAxisToStacked = function () {
        /*
        yScale.domainMin(d3.min(p.data, function (s) {
            return d3.min(s.values, function (d) {
                return d.y0 + d[p.config.yDataKey];
            });
        }));
        */

        var oldMax = p.yScale.domainMax();
        p.yScale.domainMax(d3.max(p.data, function (s) {
            return d3.max(s.values, function (d) {
                return d.y0 + d[p.config.yDataKey];
            });
        }));

        if (oldMax !== p.yScale.domainMax()) {
            viz.refreshRegistry(bar.id());
        }
    };

    /**
     * Transitions axis to grouped
     *
     * Only uses the y value to determine the domain max
     *
     * TODO Figure out way to include pin-to in domain setting
     * right now, this won't work quite right for non-zero based
     * axes
     */
    p.transitionAxisToGrouped = function () {
        /*
        yScale.domainMin(d3.min(p.data, function (s) {
            return d3.min(s.values, function (d) {
                return d[p.config.yDataKey];
            });
        }));
        */

        var oldMax = p.yScale.domainMax();
        p.yScale.domainMax(d3.max(p.data, function (s) {
            return d3.max(s.values, function (d) {
                return d[p.config.yDataKey];
            });
        }));

        if (oldMax !== p.yScale.domainMax()) {
            viz.refreshRegistry(bar.id());
        }
    };

    /**
     * On viz mouse move, find closest points
     * and update tooltips accordingly
     */
    p.onVizMouseMove = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse, p.config.tooltip.type);
        }

        if (p.config.highlightOnHover) {
            p.selection.selectAll('.' + bar.id() + ' rect')
                .style('fill', function (d, i) {
                    var fill = d.color || d3.select(this.parentNode).attr('fill');
                    return (cps && cps.filter(function (cp) { return d === cp.point;}).length > 0) ? d3.rgb(fill).brighter() : null;
                })
                .attr('stroke-width', function (d, i) {
                    var strokeWidth = p.config.strokeWidth;
                    return (cps && cps.filter(function (cp) {return d === cp.point;}).length > 0) ? strokeWidth + 1 : strokeWidth;
                });
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
     * Find closest points to mouse
     */
    p.closestPoints = function (mouse, type) {
        var cps,
            closest,
            x = mouse[0],
            y = mouse[1],
            v,
            minX,
            maxX,
            dist,
            ignore;

        cps = p.data.map(function (d) {
            var cp = {
                point: null,
                dist: null
            };

            sonic.each(d, function (k, v) {
                if (k !== 'values') {
                    cp[k] = v;
                }
            });

            return cp;
        });

        p.data.forEach(function (d, i) {
            for (var j = 0; j < d.values.length; j++) {
                v = d.values[j];
                minX = p.xScale.position(v[p.config.xDataKey]);
                maxX = p.xScale.position(v[p.config.xDataKey]) + Math.max(p.barGroupWidth, p.barWidth || 0);
                dist = null;
                ignore = false;

                //if point was used to fill in stack, ignore
                if (p.config.type === 'stacked' && v.filler === true) {
                    ignore = true;
                }

                //within bar group?
                if (!ignore && minX <= x && maxX >= x) {
                    if (type !== 'single') {
                        dist = Math.abs(p.xScale.position(v[p.config.xDataKey], p.config.barPosition) - x);
                    } else {
                        if (p.config.stacked) {
                            //implement me
                        } else {
                            dist = Math.abs(p.getGroupedBarPosition(v, null, d.key, p.config.barPosition) - x);
                        }
                    }
                    cps[i].point = v;
                    cps[i].dist = dist;
                }
            }
        });

        //only return series that were within buffer
        cps = cps.filter(function (d) {
            if (!sonic.isSet(d.point)) {
                return false;
            }
            if (sonic.isSet(p.config.tooltip.buffer) && sonic.isSet(p.config.tooltip.buffer.amount)) {
                if (p.config.tooltip.buffer.type === 'value') {
                    if (p.xScale.domainRangeToInterval(Math.abs(p.xScale.position(d.point[p.config.xDataKey]) - mouse[0])) > p.config.tooltip.buffer.amount) {
                        return false;
                    }
                } else {
                    if (Math.abs(p.xScale.position(d.point[p.config.xDataKey]) - mouse[0]) > p.config.tooltip.buffer.amount) {
                        return false;
                    }
                }
            }
            return true;
        });

        //filter out closest bar
        if (type === 'single' && cps.length > 0) {
            closest = cps[0];
            cps.forEach(function(d) {
                if (d.dist < closest.dist) closest = d;
            });
            cps = [closest];
        }

        //so that the closest point order matches stack order
        if (p.config.type === 'stacked') {
            cps.reverse();
        }

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
                p.config.tooltip.associatedId = bar.id();
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
                '<b>' + p.config.yDataKey + ':</b>' + cp.point[p.config.yDataKey];

            return html + '</p>';
        }).reduce(function (last, curr) {
            return last + curr;
        });
    };

    sonic.augment(bar, p, viz, 'registerable', 'listenable');

    //merge config
    bar.mergeConfig(initialConfig);

    //register this bar
    viz.register('sonic-bar', bar);

    return bar;
};

//add new bar instance
function sonic_bar_add (v, c) {
    v.body().call(sonic.bar(v, c));
}

//update existing bar instances
function sonic_bar_update (v, p, c, type) {
    var barType = (type || 'sonic-bar');
    v.find(barType, p).forEach(function (cmp) {
        cmp.mergeConfig(c);
        cmp.update();
    });
}

function sonic_bar_remove (v, c) {
    v.remove('sonic-bar', c);
}

/* Public API Methods */
sonic_api.add('addBars', sonic_bar_add);
sonic_api.add('updateBars', sonic_bar_update);
sonic_api.add('removeBars', sonic_bar_remove);

sonic.bar.significance = function (viz, initialConfig) {
    var p = {
        xScale: null,
        yScale: null,
        config: {
            /**
             *  Unique id for this set of bars
             *  Note: A unique id will be generated by framework - this is
             *  just useful for a way to get the bars by an id that you know
             */
            id: null,
            /**
             * The field that each data point uses for its x-axis value
             */
            xDataKey: 'x',
            /**
             * The field that each data point uses for its y-axis value
             */
            yDataKey: 'y',
            /**
             * The field that each data point uses to determine whether or
             * not the point meets a threshold.
             */
            zDataKey: 'z',
            /**
             * Which scale (by id) to use for the x-axis.  Can be passed in, otherwise
             * auto-generated based on xDataKey
             */
            xScaleId: null,
            /**
             * Which scale (by id) to use for the y-axis.  Can be passed in, otherwise
             * auto-generated based on yDataKey
             */
            yScaleId: null,
            /**
             * Defines default low threshold to be any data below .25. This data
             * will appear in a blue bar.
             */
            low: {
                color: 'blue',
                threshold: 0.25
            },
            /**
             * Defines default high threshold to be data higher than .75. This data will
             * appear in a red bar.
             */
            high: {
                color: 'red',
                threshold: 0.75
            },
            /**
             * Defines the area outside of the threshold. Normally no bars are shown, but
             * if hidden: false, than bars will appear at mouse over and tooltip will be
             * activated for that space.
             */
            nonSignificanceBars: {
                hidden: true,
                color: 'transparent'
            },
            /**
             * When active, the color of bars will be brightened depending on how far
             * their value is from the relevant threshold. If you choose to use this,
             * be sure to use darker base colors for the high and low colors. A hover
             * color should be specified since brightness will no longer be a good way
             * to distinguish which bar is being hovered over.
             */
            brightShading: {
                active: false,
                hoverColor: null
            },
            /** Fill opacity */
            fillOpacity: 0.75,
            /** Stroke (border) width */
            strokeWidth: 1,
            /**
             * Padding between bars in bar groups
             */
            barPadding: 3,
            /**
             * Padding between data and the scale ranges. 
             */
            widthPadVal: 0,
            /* Use a pointer cursor when hovering over bars */
            pointerHand: false,
            /** Tooltip config */
            tooltip: {
                type: 'grouped', //todo implement single (1 per line)
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
            },
            /**
             * When true, it doesn't allow groups of data to span over
             * x-axis units. 
             */
            suppressGrouping: false
        }
    };

    /**
     * Significance constructor renders the significance bars
     *
     * @param {d3.selection} sel where to render the bars to
     */
    function significance(sel) {
        var groups;

        //update this significance bar instance's selection to match current one
        p.selection = sel;

        p.computeData();
        p.setScales();

        //groups are by series key
        groups = sel.selectAll('.sonic-significance-bar.' + significance.id())
            .data(p.data, function (d) {
                return d.key;
            });

        //create groups for any new series
        groups.enter().append('g')
            .classed('sonic-significance-bar ' + significance.id(), true);

        groups.each(p.drawBars);

        groups.exit().remove();

        viz.registerVisibleContent(significance, significance.hasContent());
    }

    p.onVizClick = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        return cps;
    };

    /**
     * On viz mouse move, find closest points
     * and update tooltips accordingly. Makes the bar under
     * mouse a brighter color.
     */
    p.onVizMouseMove = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        p.updateTooltips(mouse, cps);

        p.selection.selectAll('g.sonic-significance-bar rect')
            .attr('fill', function (d, i) {
                var color;
                if(p.config.brightShading.active){
                    color = p.brightShade(p.config[d.type].color, d.type, d.z);
                } else {
                    color = p.config[d.type].color;
                }
                return (cps &&
                        cps.point[p.config.yDataKey] === d[p.config.yDataKey] &&
                        cps.point[p.config.xDataKey] === d[p.config.xDataKey]) ?
                        (p.config.brightShading.hoverColor || d3.rgb(p.config[d.type].color).brighter().brighter().toString()): color;
            });


        return cps;
    };

    /**
     * Find closest points to mouse, based on rectangle width/height
     */
    p.closestPoints = function (mouse) {
        var x = mouse[0],
            y = mouse[1],
            point = null;

        p.data.forEach(function (d, i) {
            d.values.forEach(function (v) {
                var minX = Math.abs(p.xScale.position(v[p.config.xDataKey])),
                    maxX = Math.abs(p.xScale.position(v[p.config.xDataKey]) + p.getRectWidth(v)),
                    minY = Math.abs(p.yScale.position(v[p.config.yDataKey])),
                    maxY = Math.abs(p.yScale.position(v[p.config.yDataKey]) + p.getRectHeight(v));

                if (minX <= x && maxX >= x && minY <= y && maxY >= y) {
                    point = {
                        point: v,
                        key: d.key
                    };
                }
            });
        });

        return point;
    };

    /**
     * Draw the bars for each series
     *
     * @param {Object} series object
     * @param {Number} i index of series object
     */
    p.drawBars = function (d, i) {

        //set up rects from data
        var rects = d3.select(this).selectAll('rect')
            .data(function (d) {
                return d.values;
            });

        //add new bars with designated strokeWidth and
        // attaches series name to rect
        rects.enter().append('rect')
            .attr('stroke-width', p.config.strokeWidth)
            .attr('fill-opacity', p.config.fillOpacity)
            .attr('series', function (d) {
                return d[p.config.yDataKey];
            })
            .attr('cursor', (p.config.pointerHand ? 'pointer' : ''));

        //load rects with their borders (unless its of type nonSignificanceBars)
        //at the appropriate x,y position and rectangle width/height.
        rects.transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('stroke-width', p.config.strokeWidth)
            .attr('stroke', function (d, i) {
                if (d.type === "nonSignificanceBars") {
                    return;
                } else {
                    return d3.rgb(p.config[d.type].color).darker().toString();
                }
            })
            .attr('fill', function (d, i) {
                if(p.config.brightShading.active){
                    return p.brightShade(p.config[d.type].color, d.type, d.z);
                } else {
                    return p.config[d.type].color;
                }
            })
            .attr('x', function (d, i) {
                return p.xScale.position(d[p.config.xDataKey]);
            })
            .attr('y', function (d) {
                return p.yScale.position(d[p.config.yDataKey]) + p.config.barPadding;
            })
            .attr('width', function (d) {
                return p.getRectWidth(d);
            })
            .attr('height', function (d) {
                return p.getRectHeight(d);
            });

        rects.exit().remove();
    };

    /**
     * Computes rectangle width of the data object.
     * @param {Object} holds x, y, and ztotal of data object
     */
    p.getRectWidth = function (d) {
        var width;

        if (!sonic.isSet(d.toKey)) {
            width = p.xScale.domainIntervalToRange(p.config.widthPadVal);
        } else {
            width = p.xScale.position(d.toKey) - p.xScale.position(d[p.config.xDataKey]);
        }

        return width;
    };

    /**
     * Computes rectangle height of the data object
     * @param {Object} holds x, y, and ztotal of data object
     */
    p.getRectHeight = function (d) {
        return p.yScale.rangeBand() - p.config.barPadding * 2;
    };

    /**
     * Reads in information about a point and transforms it into either a
     * high, low, or, if config = false, a nonSignificance bar.
     *
     * @param {Object} with key = series, and arr of values
     * @param {Object} array that holds like type vlaues
     * @param {String} string value of array type
     * @return {Object} holds all important transform data in a point
     */
    p.transformPoint = function (series, arrType, pointType) {
        var pnt = {};
        pnt[p.config.xDataKey] = arrType[0][p.config.xDataKey];
        pnt.toKey = arrType.length > 1 ? arrType[arrType.length - 1][p.config.xDataKey] : null;
        pnt[p.config.yDataKey] = series.key;
        pnt.type = pointType;
        pnt.ztotal = arrType.length > 1 ? arrType.reduce(function (prev, curr) {
            return {z: prev.z + curr.z};
        }).z : arrType[0].z;
        pnt.z = pnt.ztotal / arrType.length;
        pnt.breakdown = arrType;

        return pnt;
    };

    /**
     * Compute the data based off viz.data() array.
     */
    p.computeData = function () {
        p.data = [];
        viz.data().forEach(function (s) {
            var lowPoints = [],
                highPoints = [],
                hiddenPoints = [],
                vals,
                transformedSeries = {
                    key: s.key,
                    values:[]
                };

            //sort values by xDataKey
            vals = s.values.sort(sonic.sortByProp(p.config.xDataKey));
            vals.forEach(function (d, i) {
                var pnt = {};

                //checks for nonSignificanceBars config. If false and not within threshold, push hiddenPoints into
                // transformedSeries with "nonSignificanceBars" as the type.
                if (p.config.nonSignificanceBars.hidden === false) {
                    if (d[p.config.zDataKey] === 'insignificant' ||
                        ((d[p.config.zDataKey] >= p.config.low.threshold) && (d[p.config.zDataKey] <= p.config.high.threshold))) {
                        hiddenPoints.push(d);
                        pnt = p.transformPoint(s, hiddenPoints, "nonSignificanceBars");
                        transformedSeries.values.push(pnt);
                        hiddenPoints = [];
                    }
                }

                //if less than or = to the low threshold, add it to the lowPoints[]
                if (d[p.config.zDataKey] < p.config.low.threshold) {
                    lowPoints.push(d);
                }

                //transform lowPoints and push to transformedSeries
                if (lowPoints.length && (p.config.suppressGrouping || d[p.config.zDataKey] > p.config.low.threshold || i === vals.length - 2)) {
                    pnt = p.transformPoint(s, lowPoints, "low");
                    transformedSeries.values.push(pnt);
                    lowPoints = [];
                }

                //if >= the high threshold, add it to the highPoints[]
                if (d[p.config.zDataKey] > p.config.high.threshold) {
                    highPoints.push(d);
                }

                //transform highPoints and pus to transformedSeries
                if (highPoints.length && (p.config.suppressGrouping || d[p.config.zDataKey] < p.config.high.threshold || i === vals.length - 2)) {
                    pnt = p.transformPoint(s, highPoints, "high");
                    transformedSeries.values.push(pnt);
                    highPoints = [];
                }
            });

            //add transformed points that have been grouped by threshold to the data set.
            p.data.push(transformedSeries);
        });
    };

    /**
     * Sets the x and y scales for this instance  If an actual scale
     * passed in, uses that.  If a scale id passed in, use it,
     * otherwise find the appropiate scale from the datakey.
     */
    p.setScales = function () {
        if (p.config.xScaleId) {
            p.xScale = viz.findOne('scale', p.config.xScaleId);
        } else {
            p.xScale = viz.findOne('scale', { dataKey: 'x' });
            p.config.xScaleId = p.xScale.id();
        }


        if (!initialConfig.widthPadVal) {
            if (p.xScale.type() === 'time') {
                p.config.widthPadVal = 1000*60*60*24; //one day
            } else if (p.xScale.type() === 'linear') {
                p.config.widthPadVal = 1;
            }
        }

        if (p.config.yScaleId) {
            p.yScale = viz.findOne('scale', p.config.yScaleId);
        } else {
            p.yScale = viz.findOne('scale', { dataKey: 'y' });
            p.config.yScaleId = p.yScale.id();
        }
    };

    /**
     * Updates tooltips
     */
    p.updateTooltips = function (mouse, cps) {
        var renderFn = p.config.tooltip.renderFn || p.renderTooltips;

        if (p.config.tooltip) {
            if (mouse && cps) {
                p.config.tooltip.closestPoints = cps;
                p.config.tooltip.content = renderFn(cps, mouse);
                p.config.tooltip.associatedId = significance.id();
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
        return '<p><b>' + p.config.xDataKey + ': </b>' + cps.point[p.config.xDataKey] + '<br />' +
                '<b>' + p.config.yDataKey + ': </b>' + cps.point[p.config.yDataKey] + '<br />' +
                '<b>' + p.config.zDataKey + ': </b>' + cps.point[p.config.zDataKey] + '</p>';
    };

    /**
     * Makes a bar's color brighter depending on its difference from it's threshold
     *
     * @param {Hex Color} color - base color you are brightening
     * @param {String} type - indicates if bar is in 'high', 'low', or 'non-significance' group
     * @param {Number} - bar's z value to compare to threshold
     *
     * TODO: Come up with formula to adjust adjuster in case value/threshold are ever in the
     * TODO: hundreds, millions, etc. since we want a brighter() k-value between about 0-3.
     * TODO: At 3, color is usually as bright as it can get.
     */
    p.brightShade = function (color, type, value) {
        var adjuster = 100;
        if (type === 'high') {
            return d3.rgb(p.config[type].color).brighter(Math.abs(value - p.config.high.threshold) * adjuster).toString();
        } else if (type === 'low') {
            return d3.rgb(p.config[type].color).brighter(Math.abs(value - p.config.low.threshold) * adjuster).toString();
        } else {
            return p.config[type].color;
        }
    };

    sonic.augment(significance, p, viz, 'registerable', 'listenable');

    significance.mergeConfig(initialConfig);

    viz.register('sonic-significance-bar', significance);

    return significance;
};

//add new significance bar instance
function sonic_bar_significance_add (v, c) {
    v.body().call(sonic.bar.significance(v, c));
}

function sonic_bar_significance_update (v, p, c) {
    v.find('sonic-significance-bar', p).forEach(function (cmp) {
        cmp.mergeConfig(c);
        cmp.update();
    });
}

sonic_api.add('addSignificanceBars', sonic_bar_significance_add);
sonic_api.add('updateSignificanceBars', sonic_bar_significance_update);

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

sonic.bar.matrix = function (viz, initialConfig) {
    var p = {
        xScale: null,
        yScale: null,
        zScale: null,
        config: {
            xDataKey: 'x',
            yDataKey: 'y',
            zDataKey: 'z',
            /**
             * Whether the z values are continuous and need to be quantized into the 
             * specified number of buckets (vs. the z-values are already bucketed 
             * as needed)
             */
            quantize: true,
            barPadding: 5,
            buckets: 5,
            fillOpacity: 0.6,
            colors: ['#FF0000', '#f46d43', '#f6faaa', '#abdda4', '#008000'],
            tooltip: {
                type: 'grouped' //todo implement single (1 per line)
            }
        }
    };

    function matrix(sel) {
        var groups;

        p.selection = sel;

        p.computeData();
        p.setScales();

        groups = sel.selectAll('.sonic-matrix.' + matrix.id())
            .data(p.data, function (d) {
                return d.key;
            });

        groups.enter().append('g')
            .classed('sonic-matrix ' + matrix.id(), true);

        groups.each(p.drawRects);

        groups.exit().remove();

        viz.registerVisibleContent(matrix, matrix.hasContent());
    }

    p.onVizMouseMove = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        p.updateTooltips(mouse, cps);

        //@todo: highlight hovered rects

        return cps;
    };

    p.closestPoints = function (mouse) {
        var x = mouse[0],
            y = mouse[1],
            point = null;

        p.data.forEach(function (d, i) {
            d.values.forEach(function (v) {
                var minX = Math.abs(p.xScale.position(v[p.config.xDataKey])),
                    maxX = Math.abs(p.xScale.position(v[p.config.xDataKey]) + p.getRectWidth()),
                    minY = Math.abs(p.yScale.position(v[p.config.yDataKey])),
                    maxY = Math.abs(p.yScale.position(v[p.config.yDataKey]) + p.getRectHeight());

                if (minX <= x && maxX >= x && minY <= y && maxY >= y) {
                    point = {
                        point: v,
                        key: d.key,
                        keyName: d.keyName
                    };
                }
            });
        });

        return point;
    };

    p.drawRects = function (d, sIndex) {
        var rects = d3.select(this).selectAll('rect')
            .data(function (d) {
                return d.values;
            });

        rects.enter().append('rect')
            .attr('fill-opacity', p.config.fillOpacity)
            .attr('x', function (d, i) {
                return p.xScale.position(d[p.config.xDataKey]) + p.config.barPadding;
            })
            .attr('y', function (d) {
                return p.yScale.position(d[p.config.yDataKey]);
            });

        rects.transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('stroke-width', p.config.strokeWidth)
            .attr('fill', function (d, i) {
                return p.config.colors[p.zScale(d[p.config.zDataKey])];
            })
            .attr('x', function (d, i) {
                return p.xScale.position(d[p.config.xDataKey]) + p.config.barPadding;
            })
            .attr('y', function (d) {
                return p.yScale.position(d[p.config.yDataKey]);
            })
            .attr('width', p.getRectWidth())
            .attr('height', p.getRectHeight());

        rects.exit().remove();
    };

    p.getRectWidth = function () {
        return p.xScale.rangeBand() - p.config.barPadding;
    };

    p.getRectHeight = function () {
        return p.yScale.rangeBand() - p.config.barPadding * 2;
    };

    p.setScales = function () {
        var zDomain;

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

        //quantize === false means that the z values already correspond to the bucket values
        //otherwise, the z value range is quantized
        if (p.config.quantize === false) {
            p.zScale = d3.scale.identity(d3.range(0, p.config.buckets));
        } else {
            zDomain = p.data.reduce(function (prev, curr) {
                return prev.concat(curr.values.map(function (d) {
                    return d[p.config.zDataKey];
                }));
            }, []);
            p.zScale = d3.scale.quantile().domain(zDomain).range(d3.range(0, p.config.buckets));
        }
    };

    p.computeData = function () {
        if (sonic.isSet(p.config.seriesKey)) {
            p.data = [viz.dataByKey(p.config.seriesKey)];
        } else if (sonic.isSet(p.config.seriesIndex)) {
            p.data = [viz.dataByIndex(p.config.seriesIndex)];
        } else {
            p.data = viz.data();
        }
    };

    p.updateTooltips = function (mouse, cps) {
        var renderFn = p.config.tooltip.renderFn || p.renderTooltips;

        if (p.config.tooltip) {
            if (mouse && cps) {
                p.config.tooltip.closestPoints = cps;
                p.config.tooltip.content = renderFn(cps, mouse);
                p.config.tooltip.associatedId = matrix.id();
                p.config.tooltip.mouse = mouse;

                viz.showTooltip(p.config.tooltip);
            } else {
                viz.hideTooltip(p.config.tooltip);
            }
        }
    };

    p.renderTooltips = function (cps, mouse) {
        return '<p><b>' + p.config.xDataKey + ': </b>' + cps.point[p.config.xDataKey] + '<br />' +
                '<b>' + p.config.yDataKey + ': </b>' + cps.point[p.config.yDataKey] + '<br />' +
                '<b>' + p.config.zDataKey + ': </b>' + cps.point[p.config.zDataKey] + '</p>';
    };

    sonic.augment(matrix, p, viz, 'registerable', 'listenable');
    matrix.mergeConfig(initialConfig);
    viz.register('sonic-matrix', matrix);

    return matrix;
};

function sonic_bar_matrix_add (v, c) {
    v.body().call(sonic.bar.matrix(v, c));
}

sonic_api.add('addMatrix', sonic_bar_matrix_add);

sonic.area = function (viz, initialConfig) {
    var p = {
        xScale: null,
        yScale: null,
        defaultColors: sonic.colors.colorMap(),
        config: {
            /**
             * Type of area chart - basic vs. stacked
             */
            type: 'basic', //or stacked
            /**
             * How should the line that makes the edge of the area be interpolated
             */
            interpolator: 'linear', //or basis
            /**
             * How should the stack be calculated.  See d3 docs for more info
             */
            offset: 'zero', //org silhouette, wiggle, expand, or function
            /**
             *  Unique id for this set of bars
             *  Note: A unique id will be generated by framework - this is
             *  just useful for a way to get the bars by an id that you know
             */
            id: null,
            /**
             * Set of css classes to add to the bars
             */
            cls: '',
            /**
             * The field that makes each data point unique
             */
            definedDataKey: 'id',
            /**
             * The field that each data point uses for its x-axis value
             */
            xDataKey: 'x',
            /**
             * The field that each data point uses for its y-axis value
             */
            yDataKey: 'y',
            /**
             * Which scale (by id) to use for the x-axis.  Can be passed in, otherwise
             * auto-generated based on xDataKey
             */
            xScaleId: null,
            /**
             * Which scale (by id) to use for the y-axis.  Can be passed in, otherwise
             * auto-generated based on yDataKey
             */
            yScaleId: null,
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
             * Stroke color
             * Note: Will use series colors instead from data if they are defined
             */
            stroke: 'black',
            /**
             * Fill color
             * Note: Will use series colors instead from data if they are defined
             */
            fill: null,
            /**
             * Starting fill color
             */
            startingFill: '#FFF',
            /**
             * Whether to sort the data before rendering
             */
            sort: false,
            /**
             * Controls animation of bars. Duration controls how long it takes to update
             * a bar. Delay when null will update left --> right, otherwise it will update all
             * at once.
             */
            animation: {
                duration: null,
                delay: null
            },
            /** Stroke (border) width */
            strokeWidth: 1,
            /** Fill opacity */
            fillOpacity: 1,
            /** Tooltip config */
            tooltip: {
                /**
                 * Only show the tooltip if closest point is within a certain
                 * buffer area - can be by value, or by pixel
                 */
                buffer: {
                    type: 'value', //or pixel
                    amount: null //value, or px amount
                },
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
     * Area constructor renders areas
     *
     * @param {d3.selection} sel where to render the areas to
     * @param {Object} opts extra information on how to render the areas
     *   generally used to specify custom transitions
     */
    function area(sel, opts) {
        var classes = [p.config.cls, 'sonic-area', area.id()],
            groups;

        //update this bar instance's selection to match the current one
        p.selection = sel;

        p.computeData(opts || {});
        p.setScales();

        //group for each series
        groups = sel.selectAll(classes.join('.'))
            .data(p.data, function (s) {
                return s.key;
            });

        //create groups for any new series
        groups.enter().insert('g')
            .classed(classes.join(' '), true)
            .append('path')
                .attr('fill', p.config.startingFill);

        //for each group, draw areas
        groups.each(p.drawAreas);

        groups.each(p.setupLegend);

        //remove old series
        groups.exit().remove();

        //Since we attempted to draw areas, we alert the viz
        //if we were successful or not
        viz.registerVisibleContent(area, area.hasContent());
    }

    /**
     * Compute the data based off viz.data() array
     */
    p.computeData = function (opts) {
        p.data = [];
        if (opts.remove) {
            return;
        }
        p.data = viz.dataBySeries(p.config.seriesKeys, p.config.seriesIndexes);

        if (p.data.length === 0) {
            return;
        }

        if (p.config.type === 'stacked') {
            p.computeStackedData();
        }

        /** Used for default colors - @todo probably a better way */
        p.data.forEach(function (s, i) {
            s.index = i;
        });
    };

    /**
     * Compute the data for a stacked area chart, which basically adds a
     * y0 value onto each data point.  Because of this, make sure to
     * clone viz.data() since using stack is destructive
     *
     * Stack layout expects equal number of values per series, so this
     * "fills in" the values arrays for each series so the length is equal.
     * Each point has a value of 0, and a filler=true variable so that it
     * can be ignored in other parts of this code. It also expects the
     * values array to be sorted the same way between series
     *
     * Note: Requires computeData to be called first
     */
    p.computeStackedData = function () {
        var uniqueXVals,
            stack;

        //create stack
        stack = d3.layout.stack()
            .values(function (d) {
                return d.values;
            })
            .x(function (d) { return d[p.config.xDataKey]; })
            .y(function (d) { return d[p.config.yDataKey]; })
            .offset(p.config.offset);

        //get unique x values amongst data
        uniqueXVals = sonic.array.unique(p.data.map(function (s) {
            return s.values.map(function (d) {
                return d[p.config.xDataKey];
            });
        }));

        //fill in values arrays & sort for each series to be same
        //length before stack (stack layout requires these conditions)
        p.data = sonic.clone(p.data).map(function (s) {
            uniqueXVals.forEach(function (k) {
                var pt = {};

                if (!sonic.array.contains(
                        sonic.array.pluck(s.values, p.config.xDataKey),
                        k
                    )) {

                    pt[p.config.xDataKey] = k;
                    pt[p.config.yDataKey] = 0;
                    pt.filler = true; //labeled so not shown later on
                    s.values.push(pt);
                }
            });

            s.values.sort(sonic.sortByProp(p.config.xDataKey));
            return s;
        });

        //do the stack
        p.data = stack(p.data);
    };

    /**
     * Sets the x and y scales for this instance  If an actual scale
     * passed in, uses that.  If a scale id passed in, use it,
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
                p.config.yScaleId = p.yScale.id();
            }
        }

        //since the stacked chart aggregates data points together, need
        //to update the scale/axis to fit the aggregate values
        if (p.config.type === 'stacked') {
            p.transitionAxisToStacked();
        } else {
            p.transitionAxisToBasic();
        }
    };

    /**
     * Transition axis to stacked
     *
     * Determines new domain max by looping through values
     * and adding y0 to y value
     */
    p.transitionAxisToStacked = function () {
        var oldMin = p.yScale.domainMin(),
            oldMax = p.yScale.domainMax();

        if (p.data.length === 0) {
            return;
        }

        p.yScale.domainMin(d3.min(p.data, function (s) {
            return d3.min(s.values, function (d) {
                return d.y0;
            });
        }));

        p.yScale.domainMax(d3.max(p.data, function (s) {
            return d3.max(s.values, function (d) {
                return d.y0 + d[p.config.yDataKey];
            });
        }));

        if (p.yScale.domainMax() !== oldMax || p.yScale.domainMin() !== oldMin) {
            viz.refreshRegistry(area.id());
        }
    };

    /**
     * Transitions axis to basic
     *
     * Only uses the y value to determine the domain max
     *
     * TODO Figure out way to include pin-to in domain setting
     * right now, this won't work quite right for non-zero based
     * axes
     */
    p.transitionAxisToBasic = function () {
        /*
        p.yScale.domainMin(d3.min(data, function (s) {
            return d3.min(s.values, function (d) {
                return d[config.yDataKey];
            });
        }));
        */
        var oldMax = p.yScale.domainMax();
        p.yScale.domainMax(d3.max(p.data, function (s) {
            return d3.max(s.values, function (d) {
                return d[p.config.yDataKey];
            });
        }));
        if (oldMax !== p.yScale.domainMax()) {
            viz.refreshRegistry(area.id());
        }
    };

    p.setupLegend = function (series, i, opts) {
        d3.select(this).selectAll('path')
            .attr(area.id() + '-data-legend', function () {
                return series.name || series.key;
            });
    };

    /**
     * Draw the areas for each series
     *
     * @param {Object} series object
     * @param {Number} i index of series
     * @param {Object} opts Options for how to render the bars
     */
    p.drawAreas = function (series, i, opts) {
        var areaGen = p.areaGenerator();

        d3.select(this).selectAll('path')
            .data(p.data)
            .transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('fill', function (d, i) {
                return p.getFillColor.call(this, d, i, series);
            })
            .attr('fill-opacity', p.config.fillOpacity)
            .attr('stroke', function (d, i) {
                var color = p.getFillColor.call(this, d, i, series);
                if (color) {
                    color = d3.rgb(color).darker();
                }
                return color;
            })
            .attr('stroke-width', p.config.strokeWidth)
            .attr('d', function (d) {
                var vals = series.values;
                if (p.config.sort) {
                    vals = p.xScale.sort(vals);
                }
                return areaGen(vals);
            });
    };

    /**
     * Getnerate the area path - note that if stacked, need to take
     * into account y0 value
     */
    p.areaGenerator = function () {
        return d3.svg.area()
            .interpolate(p.config.interpolator)
            .x(function (d) {
                return p.xScale.position(d[p.config.xDataKey]);
            })
            .y0(function (d) {
                return p.config.type === 'stacked' ?
                        p.yScale.position(d.y0) : p.yScale.position(p.yScale.domainMin());
            })
            .y1(function (d) {
                return p.config.type === 'stacked' ?
                        p.yScale.position(d.y0 + d[p.config.yDataKey]) :
                        p.yScale.position(d[p.config.yDataKey]);
            });
    };

    /**
     * Get fill color for area - first tries series color, then
     * the default color for the specified index
     */
    p.getFillColor = function (d, i, series) {
        return series.color || p.config.fill || p.defaultColors(series.index);
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
     * Find closest points to mouse
     */
    p.closestPoints = function (mouse) {
        var cps = [],
            inRange,
            noConfig,
            x = mouse[0],
            y = mouse[1];

        if (sonic.isSet(p.config.tooltip.buffer.value) === true) {
            inRange = (y >= p.yScale.rangeMin() && y <= p.yScale.rangeMax());
            if (inRange === false) {
                return [];
            }
        } else {
            noConfig = true;
        }

        if (inRange || noConfig) {
            cps = p.data.map(function (d) {
                var cp = {
                    dist: null,
                    point: null
                };

                sonic.each(d, function (k,v) {
                    if (k !== 'values') {
                        cp[k] = v;
                    }
                });

                return cp;
            });

            p.data.forEach(function (d, i) {
                d.values.forEach(function (v) {
                    var dist = Math.abs(p.xScale.position(v[p.config.xDataKey], 'center') - x);

                    //if a filler object (just used to fill out the stack layout), ignore
                    if (v.filler) {
                        return;
                    }

                    if (!cps[i].point || dist < cps[i].dist) {
                        //check to make sure point is within buffer before
                        //considering it actually a close point
                        if (p.pointWithinBuffer(v, dist)) {
                            cps[i].point = v;
                            cps[i].dist = dist;
                        }
                    }
                });
            });

            //if no closest points in a series, don't return that series
            cps = cps.filter(function (d) {
                return (sonic.isSet(d.point)) ? true : false;
            });
        }

        return cps;
    };

    /**
     * Is the point, alongside its px distance within the buffer?
     *
     * Can use value, or pixel as buffer
     */
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
                p.config.tooltip.associatedId = area.id();
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
                '<b>' + p.config.yDataKey + ':</b>' + cp.point[p.config.yDataKey];

            return html + '</p>';
        }).reduce(function (last, curr) {
            return last + curr;
        });
    };

    /**
     * Make the network registerable and listenable
     */
    sonic.augment(area, p, viz, 'registerable', 'listenable');

    //merge config
    area.mergeConfig(initialConfig);

    //register this area
    viz.register('sonic-area', area);

    return area;
};

//add new area instance
function sonic_area_add (v, c) {
    v.body().call(sonic.area(v, c));
}

//update existing bar instances
function sonic_area_update (v, p, c) {
    v.find('sonic-area', p).forEach(function (cmp) {
        cmp.mergeConfig(c);
        cmp.update();
    });
}

function sonic_area_remove (v, c) {
    v.remove('sonic-area', c);
}

/* Public API Methods */
sonic_api.add('addArea', sonic_area_add);
sonic_api.add('addAreas', sonic_area_add);
sonic_api.add('removeAreas', sonic_area_remove);
sonic_api.add('updateAreas', sonic_area_update);

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

sonic.hpie = function (viz, initialConfig) {
    var p = {
        config: {
            id: null,
            seriesKey: null,
            colors: sonic.colors.colorMap(),
            tooltip: {},
            colorByKey: 'group',
            labels: {
                show: true,
                threshold: Math.PI / 6,
                pointsPerPixel: 1 / 6
            }
        }
    };

    function hpie (sel, opts) {
        var classes = [p.config.cls, 'sonic-hpie'],
            groups;

        p.selection = sel;

        p.computeData(opts || {});

        groups = sel.selectAll('.sonic-hpie.' + hpie.id())
            .data(p.data, function (d) { return d.id || d.key + 'series'; });

        groups.enter().append('g')
            .classed('sonic-hpie ' + hpie.id(), true);

        groups
            .attr('transform', function (g) {
                return 'translate(' + (viz.body().width() / 2) + ',' + (viz.body().height() / 2) + ')';
            });

        groups.each(p.drawPie);

        if (p.config.labels.show) {
            groups.each(p.drawLabels);
        }

        //remove old slices
        groups.exit().remove();

        //since we just tried to draw a pie, we ask the viz to check its
        //content so it can appropriately update the no data message
        viz.registerVisibleContent(hpie, hpie.hasContent);
    }

    p.computeData = function (opts) {
        var partition = d3.layout.partition()
            .sort(null)
            .size([2 * Math.PI, Math.pow((Math.min(viz.body().width(), viz.body().height()) / 2), 2)])
            .value(function (d) { return d.size || 1; }),
            d;

        p.data = [];

        if (opts.remove) {
            return;
        }

        d = viz.dataBySeries(p.config.seriesKeys, null)
                .filter(function (d, i) {
                    if (d.values.length > 0) {
                        return true;
                    }
                });

        p.data = d.map(function (dp) {
            dp.values = partition.nodes(dp.values[0]);
            return dp;
        });

    };

    p.arcGenerator = function () {
        return d3.svg.arc()
            .startAngle(function(d) { return d.x; })
            .endAngle(function(d) { return d.x + d.dx; })
            .innerRadius(function(d) { return Math.sqrt(d.y); })
            .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });
    };

    p.arcTween = function (d) {
        var i = d3.interpolate({x: this._current.x, dx: this._current.dx}, d);
        this._current = i(0);

        return function (t) {
            return p.arcGenerator()(i(t));
        };
    };

    p.updateSlice = function (slice, index) {
        d3.select(this)
            .transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attrTween('d', p.arcTween);
    };

    p.drawPie = function (series, idx) {
        var groups = d3.select(this).selectAll('.pie-series')
            .data(series.values, function (d) { return d.name + '_' + d.id; });

        groups.enter().append('path')
            .classed('pie-series', true)
            .attr('id', function (d) { return d.id; })
            .attr('d', p.arcGenerator())
            .style('fill', function (d, i) {
                return d.color || p.config.colors(d[p.config.colorByKey] || d.name);
            })
            .attr('fill-opacity', 1)
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 1)
            .attr('stroke', function (d, i) {
                var dc = d.color || p.config.colors(d[p.config.colorByKey] || d.name);
                return d3.rgb(dc).darker().toString();
            })
            .each(function (d) { this._current = d; });

        groups.each(p.updateSlice);

        groups.exit().remove();
    };

    p.drawLabels = function (series, idx) {
        var groups = d3.select(this).selectAll('.sonic-hpie-labels')
            .data(series.values, function (d) { return d.name + '_' + d.id; });

        groups.enter().append('text')
            .classed('sonic-hpie-labels', true)
            .attr('dy', 20)
            .attr('dx', 10)
            .style('font-weight', 'bold')
                .append('textPath')
                    .classed('label-textpath', true)
                    .attr('xlink:href', function (d) { return '#' + d.id; });

        groups.selectAll('.label-textpath')
            .text(p.calcLabelText);

        /* this does pertendicular labels, should consider making this an configurable
        groups.transition()
             .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('transform', function (d) {
                var rotate = p.calcLabelRotation(d);
                var translate = p.calcLabelTranslate(d);
                return 'translate(' + translate + ')rotate(' + rotate + ')';
            })
            .text(p.calcLabelText);*/

        groups.exit().remove();
    };

    p.calcLabelText = function (d) {
        var r = (Math.sqrt(d.y + d.dy) - Math.sqrt(d.y)) / 2 + Math.sqrt(d.y),
            width = r * d.dx,
            maxLength = Math.floor(width * p.config.labels.pointsPerPixel);

        //@TODO make showing middle label configurable
        if (d.dx < p.config.labels.threshold || d.depth === 0) {
            return '';
        }

        if (d.name.length > maxLength) {
            return d.name.substring(0, Math.max(3, maxLength - 3)) + '...';
        } else {
            return d.name;
        }
    };

    p.calcLabelTranslate = function (d) {
        var translate = p.arcGenerator().centroid(d);
        if (d.x === 2 * Math.PI) {
            return 0;
        }
        return translate;
    };

    p.calcLabelRotation = function (d) {
        var rotate = 0,
            theta = d.x + d.dx / 2,
            q;
        if (d.dx === 2 * Math.PI) {
            return 0;
        }

        if (theta <= Math.PI / 2) {
            q = 1;
        } else if (theta <= Math.PI) {
            q = 4;
        } else if (theta <= 3 * Math.PI / 2) {
            q = 3;
        } else {
            q = 2;
        }

        switch (q) {
        case 1:
            rotate = -1 * (Math.PI / 2 - theta) * 180 / Math.PI;
            break;
        case 4:
            rotate = (theta - Math.PI / 2) * 180 / Math.PI;
            break;
        case 3:
            rotate = -1 * (3 * Math.PI / 2 - theta) * 180 / Math.PI;
            break;
        case 2:
            rotate = (theta - 3 * Math.PI / 2) * 180 / Math.PI;
            break;
        }

        return rotate;
    };

    hpie.highlightSlices = function (attr) {
        p.selection.selectAll('.pie-series').each(function (d) {
            var dc, pass = sonic.object.keys(attr).length > 0 ? true : false;
            sonic.each(attr, function (aKey, value) {
                if (!sonic.array.contains(value, d[aKey])) {
                    pass = false;
                }
            });
            if (pass) {
                d3.select(this).classed('sonic-hpie-selected', true);
            } else {
                d3.select(this).classed('sonic-hpie-selected', false);
            }
        });
    };

    /**
     * Default render tooltip function
     *
     *@todo create better default
     */
    p.renderTooltips = function (cps, mouse) {
        return cps.map(function (cp) {
            var html = '<p>';
            html = html + '<b>' + cp.name + ': </b>' +
                ((cp.dx) / (2 * Math.PI) * 100).toFixed(2) +
                '% (' + cp.value + ')<br />';
            return html + '</p>';
        }).join('');
    };

    p.onVizClick = function (mouse) {
        var cps = p.closestPoints(mouse);

        return cps;
    };

    /**
     * On viz mouse move, find closest points
     * and update tooltips accordingly.
     */
    p.onVizMouseMove = function (mouse) {
        var cps = p.closestPoints(mouse);

        p.updateTooltips(mouse, cps);

        p.selection.selectAll('.pie-series').each(function (d) {
            if (sonic.array.contains(cps, d)) {
                d3.select(this)
                    .classed('sonic-hpie-hover', true)
                    .attr('stroke', function (d) {
                        var dc = d.color || p.config.colors(d[p.config.colorByKey] || d.name);
                        return d3.rgb(dc).darker().darker().toString();
                    })
                    .style('fill', function (d, i) {
                        var df =  d.color || p.config.colors(d[p.config.colorByKey] || d.name);
                        return d3.rgb(df).brighter().toString();
                    });
            } else {
                d3.select(this)
                    .classed('sonic-hpie-hover', false)
                    .style('fill', function (d, i) {
                        return d.color || p.config.colors(d[p.config.colorByKey] || d.name);
                    })
                    .attr('stroke', function (d) {
                        var dc = d.color || p.config.colors(d[p.config.colorByKey] || d.name);
                        return d3.rgb(dc).darker().toString();
                    });
            }
        });

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

            dist = sonic.geom.pythagorize(dist[0], dist[1]);
        }

        p.data.forEach(function (hgraph) {
            sonic.each(hgraph.values, function (key, pt) {
                if (p.isSliceSelected(mAng, dist, pt)) {
                    cps.push(pt);
                }
            });
        });

        return cps;
    };

    p.isSliceSelected = function (mAng, dist, pt) {
        if (mAng < pt.x || mAng > pt.x + pt.dx) {
            return false;
        }
        if (dist < Math.sqrt(pt.y) || dist > Math.sqrt(pt.y + pt.dy)) {
            return false;
        }
        return true;
    };

    sonic.augment(hpie, p, viz, 'registerable', 'listenable');

    hpie.mergeConfig(initialConfig);

    viz.register('sonic-hpie', hpie);

    return hpie;
};

function sonic_hpie_add (v, c) {
    v.body().call(sonic.hpie(v, c));
}

function sonic_hpie_highlightSlices (v, p, c) {
    v.find('sonic-hpie', p).forEach(function (cmp) {
        cmp.highlightSlices(c);
    });
}

sonic_api.add('addHPie', sonic_hpie_add);
sonic_api.add('highlightSlices', sonic_hpie_highlightSlices);
sonic.punchcard = function (viz, initialConfig) {
    var p = {
        xScale: null,
        yScale: null,
        min: null,
        max: null,
        config: {
            id: null,
            cls: '',
            xDataKey: 'x',
            yDataKey: 'y',
            zDataKey: 'z',
            xScaleId: null,
            yScaleId: null,
            stroke: initialConfig && initialConfig.fill && !initialConfig.stroke ? initialConfig.fill : 'black',
            fill: initialConfig && initialConfig.stroke && !initialConfig.fill ? initialConfig.stroke : 'black',
            fillOpacity: 1,
            radius: [2, 10],
            clickable: true,
            tooltip: {
                buffer: null,
                type: 'grouped'
            }
        }
    };

    function punchcard(sel, opts) {
        var classes = [p.config.cls, 'sonic-punchcard'],
            groups,
            punches;

        p.selection = sel;

        p.computeData(opts || {});
        p.setScales();

        groups = sel.selectAll('.sonic-punchcard.' + punchcard.id())
            .data(p.data, function (d) {
                return d.key;
            });

        groups.enter().append('g')
            .classed('sonic-punchcard ' + punchcard.id(), true);

        groups.each(p.drawPunches);

        groups.exit().remove();

        //Since we just tried to draw a punchcard, we ask the viz to check
        //its content to update the no data message appropriately
        viz.registerVisibleContent(punchcard, punchcard.hasContent());
    }

    punchcard.hasContent = sonic.override(function () {
        var hasContent = false;

        if (p.data.length > 0) {
            p.data.forEach(function (k) {
                if (k.values.length > 0) {
                    hasContent = true;
                    return;
                }
            }, this);
        }

        return hasContent;
    });

    p.onVizMouseMove = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        p.updateTooltips(mouse, cps);

        p.selection.selectAll('circle:not(.selected)')
            .classed('hovered', function (d, i) {
                return sonic.isSet(cps) ? p.isClosestPoint(d, cps) : false;
            })
            .attr('fill', p.getPunchFill)
            .attr('stroke', function () {
                return d3.rgb(p.getPunchFill.apply(this, arguments)).darker();
            });

        return cps;
    };

    p.onVizClick = function (mouse) {
        var cps;

        if (mouse) {
            cps = p.closestPoints(mouse);
        }

        if (p.config.clickable) {
            p.selection.selectAll('circle')
                .classed('selected', function (d, i) {
                    return sonic.isSet(cps) ? p.isClosestPoint(d, cps) : false;
                })
                .classed('hovered', false)
                .attr('fill', p.getPunchFill)
                .attr('stroke', function () {
                    return d3.rgb(p.getPunchFill.apply(this, arguments)).darker();
                });
        }

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

        p.data.forEach(function (s, i) {
            s.values.forEach(function (d) {
                var curDistX,
                    curDistY,
                    curDist;

                curDistX = p.xScale.position(d[p.config.xDataKey]) +
                        (p.xScale.type() === 'ordinal' ? p.xScale.rangeBand() / 2 : 0) - x;
                curDistY = p.yScale.position(d[p.config.yDataKey]) +
                        (p.yScale.type() === 'ordinal' ? p.yScale.rangeBand() / 2 : 0) - y;
                curDist = Math.sqrt(curDistX * curDistX + curDistY * curDistY);

                if (!cps[i].point || curDist < cps[i].dist) {
                    cps[i].point = d;
                    cps[i].dist = curDist;
                }
            });
        });

        cps = cps.reduce(function (totalCps, cpCandidate) {
            if ((totalCps.length === 0 || cpCandidate.dist < totalCps[0].dist) && sonic.isSet(cpCandidate.point)) {
                return [cpCandidate];
            }
            return totalCps;
        }, []);

        return cps;
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

    p.computeData = function (opts) {
        p.data = [];
        if (opts.remove) {
            return;
        }
        p.data = p.aggregateDuplicates();
        p.calcExtrema();
    };

    p.aggregateDuplicates = function () {
        var keyNames =[], m = {}, vData = viz.data();
        vData.forEach(function (seriesObj) {
            keyNames.push(seriesObj.key);
            seriesObj.values.forEach(function (point) {
                var lookup = point[p.config.xDataKey] + "-" + point[p.config.yDataKey];
                if (!m[lookup]) {
                    m[lookup] = point;
                } else {
                    m[lookup][p.config.zDataKey] = m[lookup][p.config.zDataKey] + point[p.config.zDataKey];
                }
            });
        });
        return [{
            key: "aggregated:" + keyNames.join("-"),
            values: Object.keys(m).map(function (key) {
                return m[key];
            })
        }];
    };

    p.calcExtrema = function () {
        p.min = null;
        p.max = null;
        p.data.forEach(function (seriesObj) {
            seriesObj.values.forEach(function (point) {
                if (!sonic.isSet(p.min) || point[p.config.zDataKey] < p.min) {
                    p.min = point[p.config.zDataKey];
                }
                if (!sonic.isSet(p.max) || point[p.config.zDataKey] > p.max) {
                    p.max = point[p.config.zDataKey];
                }
            });
        });
    };

    p.drawPunches = function (series, i) {
        var punches;

        punches = d3.select(this).selectAll('circle')
            .data(function (d) {
                return d.values;
            }, function (d) {
                return d.id;
            });

        punches.enter().append('circle')
            .attr('r', 0);

        punches
            .transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .attr('fill', p.getPunchFill)
            .attr('fill-opacity', p.config.fillOpacity)
            .attr('cx', function (d) {
                return p.xScale.position(d[p.config.xDataKey]) + (p.xScale.type() === 'ordinal' ? p.xScale.rangeBand() / 2 : 0);
            })
            .attr('cy', function (d) {
                return p.yScale.position(d[p.config.yDataKey]) + (p.yScale.type() === 'ordinal' ? p.yScale.rangeBand() / 2 : 0);
            })
            .attr('stroke', function () {
                return d3.rgb(p.getPunchFill.apply(this, arguments)).darker();
            })
            .attr('r', function (d) {
                var dPercent;
                dPercent = (p.max !== p.min) ? (d[p.config.zDataKey] - p.min) / (p.max - p.min) : 0.5;
                return p.config.radius[0] + (dPercent * (p.config.radius[1] - p.config.radius[0]));
            });

        punches.exit().remove();
    };

    p.updateTooltips = function (mouse, cps) {
        var content,
            renderFn = p.config.tooltip.renderFn || p.renderTooltips;

        if (p.config.tooltip) {
            if (mouse && cps) {
                p.config.tooltip.closestPoint = cps;
                p.config.tooltip.content = renderFn(cps, mouse);
                p.config.tooltip.associatedId = punchcard.id();
                p.config.tooltip.mouse = mouse;

                viz.showTooltip(p.config.tooltip);
            } else {
                viz.hideTooltip(p.config.tooltip);
            }
        }
    };

    p.renderTooltips = function (cps, mouse) {
        if (cps.length === 0) {
            return;
        } else {
            return '<p><b>' + p.config.xDataKey + ': </b>' + cps[0].point[p.config.xDataKey] + '<br />' +
                    '<b>' + p.config.yDataKey + ': </b>' + cps[0].point[p.config.yDataKey] + '<br />' +
                    '<b>' + p.config.zDataKey + ': </b>' + cps[0].point[p.config.zDataKey] + '</p>';
        }
    };

    p.isClosestPoint = function (d, cps) {
        var isClosest = false;

        cps.forEach(function (c) {
            if (c.point && c.point.id === d.id) {
                isClosest = true;
            }
        });

        return isClosest;
    };

    p.getSelected = function (d, i) {
        return sonic.svg.hasClass(this, 'selected');
    };

    p.getHovered = function (d, i) {
        return sonic.svg.hasClass(this, 'hovered');
    };

    /**
     * @todo color should always go with series data, not assume 1 here
     */
    p.getPunchFill = function (d, i) {
        var fill = p.config.fill;

        if (sonic.isSet(p.data[0].color)) {
            fill = p.data[0].color;
        }

        if (sonic.isSet(d.color)) {
            fill = d.color;
        }

        if (p.getSelected.call(this, d, i) || p.getHovered.call(this, d, i)) {
            fill = d3.rgb(fill).brighter(3).toString();
        }

        return fill;
    };

    sonic.augment(punchcard, p, viz, 'registerable', 'listenable');

    punchcard.mergeConfig(initialConfig);

    viz.register('sonic-punchcard', punchcard);

    return punchcard;
};

function sonic_punchcard_add (v, c) {
    v.body().call(sonic.punchcard(v, c));
}

function sonic_punchcard_remove (v, c) {
    v.remove('sonic-punchcard', c);
}

/**
 * Update matching punchcards in viz v, based on params p,
 * to have config c
 */
function sonic_punchcard_update (v, p, c) {
    v.find('sonic-punchcard', p).forEach(function (cmp) {
        cmp.mergeConfig(c);
        cmp.update();
    });
}

sonic_api.add('addPunchcard', sonic_punchcard_add);
sonic_api.add('addPunches', sonic_punchcard_add);
sonic_api.add('updatePunchcard', sonic_punchcard_update);
sonic_api.add('updatePunches', sonic_punchcard_update);
sonic_api.add('removePunches', sonic_punchcard_remove);

sonic.geo = {};

sonic.geo.choropleth = function (viz, initialConfig) {
    var p = {
        scale: null, //scale to use for coloring of regions
        defaultColors: sonic.colors.colorMap(), //default colors
        projection: null, //projection of map
        path: null, //geo path generator (uses projection)
        config: {
            /**
             *  Unique id for this set of bars
             *  Note: A unique id will be generated by framework - this is
             *  just useful for a way to get the bars by an id that you know
             */
            id: null,
            /** Set of css classes to add to the bars */
            cls: '',
            /** Which property of each data point to use for coloring */
            dataKey: 'val',
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
            /** Manually set colors for buckets */
            colors: null,
            /** Color scheme (from colorbrewer) to use for buckets */
            colorScheme: 'Blues',
            /** Number of buckets to split data into */
            buckets: 9,
            /** Config for base geos */
            baseGeos: {
                /**
                 * Which base geo types to use
                 * Currently allows 'states' & 'counties' & 'nielsen_zones'
                 */
                types: [],
                /** County geo config */
                counties: {
                    mesh: false,
                    fill: '#A4A4A4',
                    stroke: 'none'
                },
                /** State geo config */
                states: {
                    mesh: true,
                    fill: 'none',
                    stroke: '#FFF'
                },
                /** Nielsen zones config */
                nielsen_zones: {
                    mesh: false,
                    fill: '#A4A4A4',
                    stroke: '#FFF'
                },
                /**
                 * Topology object to use
                 * @todo for now this must be passed in for base geos
                 * in future, should probably be able to be loaded
                 * by sonic
                 */
                topology: null
            },
            /** Projection properties */
            projection: {
                /** Projection type */
                type: 'albersUsa',
                /** Scale (how much to zoom) */
                scale: 1070,
                /**
                 * Where to center map on
                 * By default, show in center of viz body
                 */
                translate: 'center'
            },
            /** Tooltip config */
            tooltip: {
                /**
                 * Custom function to render the tooltips
                 *geo-polygon-highlight
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
     * Constuctor renders choropleth
     *
     * @todo for now, renders 1 set of geos per data series included..which means
     * that if multiple series, will show charts on top of each other
     * default behavior should probably be to show 1 map per series next to one
     * another and shrink them
     */
    function choropleth(sel, opts) {
        var classes = [p.config.cls, 'sonic-choropleth', choropleth.id()],
            groups;

        //update d3 selection
        p.selection = sel;

        //set up geo properties of choropleth
        p.computeProjection();
        p.computePath();
        p.computeZoom();

        p.computeData(opts);
        p.setScales();

        //group for each series
        groups = sel.selectAll(classes.join('.'))
            .data(data, function (d) {
                return d.key;
            });

        //create groups for any new series
        groups.enter().append('g')
            .classed(classes.join(' '), true);

        groups.each(p.drawGeos);

        groups.exit().remove();
    }

    /**
     * Set data according to seriesKeys & seriesIndexes
     */
    p.computeData = function (opts) {
        opts = opts || {};
        data = [];

        if (opts.remove) {
            return;
        }

        data = viz.dataBySeries(p.config.seriesKeys, p.config.seriesIndexes);
    };

    /**
     * Bin the choropleth values into buckets that will be later used
     * to color the regions differently, based on where in scale they fall
     */
    p.setScales = function () {
        p.scale = d3.scale.quantile()
            .domain(
                data.reduce(function (prev, curr) {
                    return prev.concat(
                        sonic.array.pluck(curr.values, p.config.dataKey)
                    );
                }, [])
            )
            .range(d3.range(0, p.config.buckets));
    };

    /**
     * Draw the geos for the current series
     */
    p.drawGeos = function (series, seriesIndex) {
        var el = this,
            baseTypes = [
                {
                    key: 'countyId',
                    type: 'counties'
                },
                {
                    key: 'stateId',
                    type: 'states'
                },
                {
                    key: 'dmaId',
                    type: 'nielsen_zones'
                }
            ];

        baseTypes.forEach(function (d) {
            if (p.config.baseGeos.types.indexOf(d.type) !== -1) {
                if (p.config.baseGeos[d.type].mesh) {
                    p.drawMeshFeature.call(el, d, series, seriesIndex);
                } else {
                    p.drawMultiFeature.call(el, d, series, seriesIndex);
                }
            }
        });
    };

    p.drawMeshFeature = function (typeInfo) {
        var groups,
            type = typeInfo.type;

        //only want one group of a meshed feature
        groups = d3.select(this).selectAll('.' + type)
                .data([1]);

        //add to groups list
        groups.enter().append('g')
            .classed(type, true)
                .append('path');

        //update the path (note, it's only 1 path, not many) and set style
        groups.select('path')
            .datum(topojson.mesh(
                p.config.baseGeos.topology,
                p.config.baseGeos.topology.objects[type],
                function (a, b) { return a !== b; }
            ))
            .style('fill', p.config.baseGeos[type].fill)
            .style('stroke', p.config.baseGeos[type].stroke)
            .attr('d', p.path);
    };

    p.drawMultiFeature = function (typeInfo, series, seriesIndex) {
        var type = typeInfo.type,
            vals = series.values,
            features,
            groups;

        //sort data according to type key
        vals.sort(sonic.sortByProp(typeInfo.key));

        //only want one group for feature list
        groups = d3.select(this).selectAll('.' + type)
                .data([1]);

        //add new feature group
        groups.enter().append('g')
            .classed(type, true);

        //draw path for each feature in topology
        features = groups.selectAll('path')
            .data(
                topojson.feature(
                    p.config.baseGeos.topology,
                    p.config.baseGeos.topology.objects[type]
                ).features,
                function (d) {
                    return d.id;
                }
            );

        //add new features, and set up interaction for each
        features.enter().append('path')
            .on('mouseover', function (d, i) {
                d3.select(this).classed('sonic-geo-polygon-highlight', true);
                p.updateTooltips(d.id, viz.mouse(this));
            })
            .on('mouseout', function (d, i) {
                d3.select(this).classed('sonic-geo-polygon-highlight', false);
                p.updateTooltips();
            })
            .on('click', p.handleClick);

        //transition features' path, as well as styling
        //the fill style is what makes the choropleth a choropleth
        features
            .transition()
            .delay(viz.animation().delay)
            .duration(viz.animation().duration)
            .style('stroke', p.config.baseGeos[type].stroke)
            .style('fill', function (d) {
                var match;

                //find matching data point from this data series
                match = sonic.array.binarySearch(
                    series.values,
                    function (v) {
                        return v[typeInfo.key] < d.id ? -1 :
                                (v[typeInfo.key] > d.id ? 1 : 0);
                    }
                );

                //Get choropleth color, or if no bucket found, use base color
                return p.getColor(
                    sonic.isSet(match) ? series.values[match][p.config.dataKey] : null
                ) || p.config.baseGeos.counties.fill;
            })
            .attr('d', p.path);
    };

    /**
     * Update tooltips
     */
    p.updateTooltips = function (id, mouse) {
        var content,
            renderFn = p.config.tooltip.renderFn || p.renderTooltips,
            cp;

        if (mouse) {
            cp = p.closestPoints(id);
        }

        if (p.config.tooltip) {
            if (sonic.isSet(id)) {
                p.config.tooltip.mouse = mouse;
                p.config.tooltip.associatedId = choropleth.id();
                p.config.tooltip.content = renderFn(cp, mouse);
                p.config.tooltip.cp = cp;
                viz.showTooltip(p.config.tooltip);

            } else {
                viz.hideTooltip(p.config.tooltip);
            }
        }
    };

    /**
     * Find closest points to mouse
     */
    p.closestPoints = function (id) {
        var cp = data[0].values;

        cp = cp.filter(function (d) {
            return (d.dmaId === id);
        });

        return cp;
    };

    /**
     * Default render tooltip function
     */
    p.renderTooltips = function (cp, mouse) {
        return '<p>' + "id : " + cp.dmaId;
    };

    /**
     * Compute projection of choropleth map
     *
     * Use existing projection properties if they exist (so that map stays
     * zoomed/panned to where it was before), otherwise use initial config
     */
    p.computeProjection = function () {
        var translate = [viz.body().width() / 2, viz.body().height() / 2];

        if (p.projection) {
            translate = p.projection.translate();
        } else if (sonic.isArray(p.config.projection.translate)) {
            translate = p.config.projection.translate;
        }

        p.projection = d3.geo[p.config.projection.type]()
            .scale(p.projection ? p.projection.scale() : p.config.projection.scale)
            .translate(translate);
    };

    /**
     * Compute geo path used by geos
     */
    p.computePath = function () {
        p.path = d3.geo.path()
            .projection(p.projection);
    };

    /**
     * Compute geo path used by geos
     */
    p.computeZoom = function () {
        viz.body().call(
            d3.behavior.zoom()
                .translate(p.projection.translate())
                .scale(p.projection.scale())
                //@todo figure out what this does, and configure
                .scaleExtent([viz.body().height(), 8 * viz.body().height()])
                .on('zoom', p.handleZoom)
        );
    };

    /**
     * Get choropleth color for the passed in value
     * by looking where it falls in the scale
     *
     * If colors manually set in config, use them.  Otherwise,
     * if colorbrewer library included, use them.  Fall back to
     * default colors.
     */
    p.getColor = function (value) {
        var bucket = p.scale(value),
            color;

        if (!value) {
            return;
        }

        if (p.config.colors) {
            color = p.config.colors[bucket];
        } else if (colorbrewer) {
            color = colorbrewer[p.config.colorScheme][Math.min(p.config.buckets, 9)][bucket];
        } else {
            color = p.defaultColors(bucket);
        }

        return color;
    };

    /**
     * On click of a geo, zoom to centroid of clicked geo
     */
    p.handleClick = function (d) {
        var centroid = p.path.centroid(d),
            currTranslation = p.projection.translate();

        //set new translation on projection
        //@todo better understand what's happening here
        p.projection.translate([
            currTranslation[0] - centroid[0] + viz.body().width() / 2,
            currTranslation[1] - centroid[1] + viz.body().height() / 2
        ]);
        //update all paths in current selection
        p.selection.selectAll('path').transition()
            .duration(2000)
            .attr('d', p.path);
    };

    /**
     * On zoom of container where zoom has been set up,
     * zoom in on the point based on where it happened and how far
     * zoomed in user now is
     */
    p.handleZoom = function () {
        //update translation and scale based on current settings (last event properties)
        p.projection.translate(d3.event.translate).scale(d3.event.scale);
        //update all paths in current selection
        p.selection.selectAll('path').attr('d', p.path);
    };

    sonic.augment(choropleth, p, viz, 'registerable');
    //merge config
    choropleth.mergeConfig(initialConfig);
    //register this point
    viz.register('sonic-choropleth', choropleth);

    return choropleth;
};

/**
 * Add a choropleth to the viz body
 */
function sonic_choropleth_add(v, c) {
    v.body().call(sonic.geo.choropleth(v, c));
}

/**
 * Update matching choropleths in viz v, based on params p,
 * to have config c
 */
function sonic_choropleth_update(v, p, c) {
    v.find('sonic-choropleth', p).forEach(function (cmp) {
        cmp.mergeConfig(c);
        cmp.update();
    });
}

/**
 * Remove choropleth from the viz body
 */
function sonic_choropleth_remove(v, c) {
    v.remove('sonic-choropleth', c);
}

/* Public API Methods */
sonic_api.add('addChoropleth', sonic_choropleth_add);
sonic_api.add('updateChoropleth', sonic_choropleth_update);
sonic_api.add('removeChoropleth', sonic_choropleth_remove);

sonic.legend = function (viz, initialConfig) {
    var p = {
        config: {
            /**
             * The legends to add. Example:
             * [
             *      {
             *          id: ['areachart', 'avgpriceline'],
             *          pos: [0.02, 0.55]
             *      },
             *      {
             *          id: ['sales' + this.getId(), 'products' + this.getId()],
             *          pos: [0.02, 0.05]
             *      }
             *  ]
             * where areachart and avgpriceline are ids of components to include
             * in the legend and pos is the positioning of the legend [x, y] as
             * percentages of the total viz height and width
             */
            legends: [],
            cls: '',
            style: {
                fill: 'white',
                stroke: 'black',
                opacity: 0.8,
                fontSize: '10px',
                font: 'sans-serif',
                fontColor: 'black',
                padding: 5
            }
        }
    };

    /**
     * Legend component
     */
    function legend(sel, opts) {
        //Remove and wait and add to ensure it is on top
        //@TODO find better way than delaying
        sel.selectAll('.sonic-legend.' + legend.id()).remove();
        p.selection = sel;
        setTimeout(function () {
            var classes = [p.config.cls, 'sonic-legend'],
                groups;
            p.selection = sel;

            p.computeData(opts || {});
            groups = sel.selectAll('.sonic-legend.' + legend.id())
                .data(p.data);

            groups.enter().append('g')
                .classed('sonic-legend ' + legend.id(), true)
                .style('font-size', p.config.style.fontSize)
                .style('font', p.config.style.font);

            groups.each(p.drawLegend);

            groups.order();

            groups.exit().remove();
        }, Math.max(viz.animation().duration * 2, 1000));
    }

    /**
     * Return empty to remove or legend data
     */
    p.computeData = function (opts) {
        p.data = [];
        if (opts.remove) {
            return;
        }
        p.data = p.config.legends;
    };

    /**
     * Draws a the legend
     */
    p.drawLegend = function (series) {
        var g = d3.select(this),
            lbbox,
            items = {},
            svg = viz.body(),
            ids = sonic.isArray(series.id) ? series.id : [series.id],
            legendPadding = p.config.style.padding,
            types = ids.map(function (id) { return id + '-data-legend'; }),
            applicableElements = svg.selectAll('[' + types.join('],[') + ']'),
            lb = g.selectAll(".legend-box").data(applicableElements[0].length > 0 ? [1] : []),
            li = g.selectAll(".legend-items").data(applicableElements[0].length > 0 ? [1] : []);

        g.attr('transform', 'translate(' + viz.body().width() * series.pos[0] + ',' + viz.body().height() * series.pos[1] + ')');

        lb.enter()
            .append("rect")
            .classed("legend-box", true)
            .style('fill', p.config.style.fill)
            .style('opacity', p.config.style.opacity)
            .style('stroke', p.config.style.stroke);
        li.enter()
            .append("g")
            .classed("legend-items", true);

        applicableElements.each(function (el) {
            var self = d3.select(this),
                type = types.filter(function (t) { return sonic.isSet(self.attr(t)); } )[0];
            items[self.attr(type)] = {
                pos: self.attr("data-legend-pos") || this.getBBox().y,
                color: sonic.isSet(self.attr("data-legend-color")) ? self.attr("data-legend-color") : self.style("fill") !== 'none' ? self.style("fill") : self.style("stroke")
            };
        });

        items = d3.entries(items).sort(function (a, b) { return a.value.pos - b.value.pos; });

        li.selectAll("text")
            .data(items, function(d) { return d.key; })
            .call(function(d) { d.enter().append("text"); })
            .call(function(d) { d.exit().remove(); })
            .attr("y", function(d,i) { return i + "em"; })
            .attr("x", "1em")
            .attr('fill', p.config.style.fontColor)
            .text(function(d) { return d.key; });

        li.selectAll("circle")
            .data(items, function(d) { return d.key; })
            .call(function(d) { d.enter().append("circle"); })
            .call(function(d) { d.exit().remove(); })
            .attr("cy",function(d,i) { return i - 0.25 + "em"; })
            .attr("cx", 0)
            .attr("r", "0.4em")
            .style("fill", function(d) { return d.value.color; });

        // Reposition and resize the box
        if (applicableElements[0].length > 0) {
            lbbox = li[0][0].getBBox();
            lb.attr("x", (lbbox.x - legendPadding))
                .attr("y", (lbbox.y - legendPadding))
                .attr("height", (lbbox.height + 2 * legendPadding))
                .attr("width", (lbbox.width + 2 * legendPadding));
        }

        li.exit().remove();
        lb.exit().remove();
    };

    sonic.augment(legend, p, viz, 'registerable');

    legend.mergeConfig(initialConfig);

    viz.register('sonic-legend', legend);

    return legend;
};

function sonic_legend_add (v, c) {
    v.body().call(sonic.legend(v, c));
}

function sonic_legend_remove(v, c) {
    v.remove('sonic-legend', c);
}

function sonic_legend_update(v, p, c) {
    v.find('sonic-legend', p).forEach(function (cmp) {
        cmp.mergeConfig(c);
        cmp.update();
    });
}

sonic_api.add('addLegend', sonic_legend_add);
sonic_api.add('updateLegend', sonic_legend_update);
sonic_api.add('removeLegend', sonic_legend_remove);
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

}());
