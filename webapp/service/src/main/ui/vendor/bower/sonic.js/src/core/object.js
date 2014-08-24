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
