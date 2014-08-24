/*
 * Exposed namespace (no var) so that it is available outside of package
 */
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
