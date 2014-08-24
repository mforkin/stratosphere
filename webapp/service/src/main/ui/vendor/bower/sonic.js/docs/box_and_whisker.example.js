var data,
    viz;

/**
 * Create a random set of points and sort them into seriesKeys
 * using utils.js functions
 */
data = createPoints();
updateDataDisplay(data);

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
    range: [0.15, 0.85]
})
.addLinearScale({
    id: 'invisible-scale',
    pos: 'left',
    dataKey: 'y',
    min: 0,
    max: 1,
    range: [0.36, 0.65]
})
.addBoxAndWhisker({
    valueKey: 'y',
    xScaleId: 'v-axis',
    yScaleId: 'invisible-scale',
    currentPoint: {
        val: data[0].values[0].y
    }
})
.addCrosshair();

/**
* Randomize the data and update the vizes
*/
function randomize() {
    var s = sonic.randomInteger(0, 2),
        cp = data[s].values[sonic.randomInteger(0, data[s].values.length - 1)].y;
    data = createPoints();
    viz.data(data);
    viz.update({
        currentPoint: {
            val: cp
        }
    });
    // TODO - ?
    updateDataDisplay(data);
};

//Event handler for when the Rnadomize Data button is pushed.
d3.select('#randomize').on('click', randomize);