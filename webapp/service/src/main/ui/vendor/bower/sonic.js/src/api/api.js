/**
 * API singleton
 *
 * This is used to dynamically add api methods to the viz
 * framework.  So, a viz component (such as bar chart) would
 * add add a public method for manipulating itself by doing 
 * something like:
 * 
 *     sonic_api.add('addBars', sonic_bar_add);
 *
 * where a developer/user would call viz.addBars() to add bars,
 * (which is what the sonic_bar_add fn would do)
 */
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
