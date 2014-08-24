var data,
    viz;

/**
* Create a random set of points and sort them into seriesKeys
* using utils.js functions
*/
data = createPoints();
data = sortToKeys(data);

/**
* Draw a line viz of count over time
*/
viz = sonic.viz('#viz', data, {
    tooltip: true,
    padding: {
        left: 100
    }
})
.addXAxis({
    type: 'time',
    label: {
        text: 'Date'
    }
})
.addYAxis({
    label: {
        text: 'Count'
    },
    series: ['b', 'c'],
    range: [0.53, 1]
})
.addLinearScale({
    id: 'invisible_scale',
    pos: 'left',
    dataKey: 'y',
    series: ['a'],
    range: [0, 0.47]
})
.addLines({
    sort: true,
    seriesKeys: ['b', 'c'],
    tooltip: {
        type: 'global'
    }
})
.addLine({
    sort: true,
    seriesKeys: ['a'],
    yScaleId: 'invisible_scale',
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
    data = createPoints();
    viz.data(sortToKeys(data));
    updateDataDisplay(data);
};

//Event handler for when the Rnadomize Data button is pushed.
d3.select('#randomize').on('click', randomize);