var data,
    viz;

/**
 * Create a random set of points and sort them into seriesKeys
 * using utils.js functions
 */
data = createHeatPoints();

updateDataDisplay(sonic.clone(data[0].values.slice(0, 25)));
/**
* Draw a line viz of count over time
*/
viz = sonic.viz('#viz', data, {
    margin: {
        right: 20,
        left: 60
    },
    visibleClear: true
})
.addXAxis({
    label: {
        text: 'X'
    }
})
.addYAxis({
    label: {
        text: 'Y'
    }
})
.addHeat();

/**
* Randomize the data and update the vizes
*/
function randomize() {
    data = createHeatPoints();
    updateDataDisplay(sonic.clone(data[0].values.slice(0, 25)));
    viz.data(data);
};

//Event handler for when the Rnadomize Data button is pushed.
d3.select('#randomize').on('click', randomize);