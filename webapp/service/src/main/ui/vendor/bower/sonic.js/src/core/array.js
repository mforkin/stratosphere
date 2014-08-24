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
