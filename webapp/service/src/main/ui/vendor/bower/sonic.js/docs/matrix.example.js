var viz,
    data = createMatrixPoints();

viz = sonic.viz('#viz', data, {
    margin: {
        right: 20,
        left: 60
    },
    tooltip: true
})
.addXAxis({
    type: 'ordinal',
    label: {
        text: 'Time of Day'
    }
})
.addYAxis({
    type: 'ordinal',
    label: {
        text: 'Day of Week'
    }
})
.addMatrix();


updateDataDisplay(data);

/**
* Randomize the data and update the vizes
*/
function randomize() {
    data = createMatrixPoints();
    viz.data(data);
    updateDataDisplay(data);
};

//Event handler for when the Rnadomize Data button is pushed.
d3.select('#randomize').on('click', randomize);

