/* Note: A "nest" is just a d3 convenience for manipulating
 * arrays/objects.  In sonic, something is considered "a nest"
 * if it's in the form
 *     [
 *         {
 *              key: key1,
 *              values: [value1, value2, value3]
 *         },
 *         {
 *              key: key2,
 *              values: [value1, value2, value3]
 *         }
 *     ]
 */
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
