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
    },
    ticks: {
        rotate: -35,
        textAnchor: 'end',
        dx: '-0.8em',
        dy: '0.15em'
    }
})
.addYAxis({
    label: {
        text: 'Count'
    }
})
.addLines({
    sort: true
})
.addCrosshair();

updateDataDisplay(data);
/**
* Randomize the data and update the vizes
*/
function randomize() {
    data = createPoints();
    viz.data(data);
    updateDataDisplay(data);
};

//Event handler for when the Rnadomize Data button is pushed.
d3.select('#randomize').on('click', randomize);