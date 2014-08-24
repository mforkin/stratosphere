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
