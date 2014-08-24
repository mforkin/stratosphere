var data,
      viz;

data = createOverlayPoints();

//creates viz
viz = sonic.viz('#viz', data, {
    margin: {
        right: 20,
        left: 60
    },
    tooltip: true
})
.addXAxis({
    type: 'time',
    label: {
        text: 'Millisecs'
    }
})
.addYAxis({
    label: {
        text: 'Count of rxBytes'
    }
})
.addLine({
    seriesIndexes: [0, 1, 2],
    sort: true,
    tooltip: {
        type: 'global'
    }
})
.addOverlayBars({
    seriesKeys: 'overlays',
    tooltip: {
        type: 'global'
    }
});


updateDataDisplay(data);

/**
* Randomize the data and update the vizes
*/
function randomize() {
    data = createOverlayPoints();
    viz.data(data);
    updateDataDisplay(data);
};

//Event handler for when the Rnadomize Data button is pushed.
d3.select('#randomize').on('click', randomize);