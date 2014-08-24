var data,
    viz,
    //aggregates counts of data at certain bins
    normalizeData = function (data) {
        var bins = d3.range(5, 105, 5);
        data.forEach(function (s) {
            var lookup = {};
            s.values.forEach(function (d) {
                var bin = bins.filter(function (b) { return d.y < b; })[0];
                if (!lookup[bin]) {
                    lookup[bin] = d;
                    lookup[bin].y = bin;
                    lookup[bin].y2 = 0;
                } else {
                    lookup[bin].y2 += 1;
                }
            });

            s.values = sonic.object.values(lookup);
        });
        return data;
    };

/**
 * Create a random set of points and sort them into seriesKeys
 * using utils.js functions
 */
data = normalizeData(createPoints(null, null, {whole: true}));

/**
* Draw a line viz of count over time
*/
viz = sonic.viz('#viz', data, {
    tooltip: true
})
.addXAxis({
    id: 'v-axis',
    dataKey: 'y',
    label: {
        text: 'Values'
    },
    range: [.15, .85],
    min: 0,
    max: 100
})
.addLinearScale({
    id: 'box-scale',
    pos: 'left',
    min: 0,
    max: 1,
    range: [0, 0.45]
})
.addLinearScale({
    id: 'bar-scale',
    pos: 'left',
    dataKey: 'y2',
    seriesIndexes: [0],
    min: 0,
    range: [0.65, 1]
})
.addBars({
    yScaleId: 'bar-scale',
    yDataKey: 'y2',
    xDataKey: 'y',
    minBarWidth: 4,
    seriesIndexes: [0],
    tooltip: {
        type: 'global'
    },
    sort: true,
    animation: {
        duration: 0,
        delay: 0
    }
})
.addBoxAndWhisker({
    valueKey: 'y',
    xScaleId: 'v-axis',
    yScaleId: 'box-scale',
    currentPoint: {
        val: data[0].values[0].y
    },
    tooltip: {
        type: 'global'
    }
})
.addCrosshair();

updateDataDisplay(data);

/**
* Randomize the data and update the vizes
*/
function randomize() {
    var s = sonic.randomInteger(0, 2),
        cp;
    data = normalizeData(createPoints());
    cp = data[0].values[sonic.randomInteger(0, data[0].values.length - 1)].y;
    viz.data(data);
    viz.updateBoxAndWhisker({}, {
        currentPoint: {
            val: cp
        }
    });
    updateDataDisplay(data);
};

//Event handler for when the Randomize Data button is pushed.
d3.select('#randomize').on('click', randomize);