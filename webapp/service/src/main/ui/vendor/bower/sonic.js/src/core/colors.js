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