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
