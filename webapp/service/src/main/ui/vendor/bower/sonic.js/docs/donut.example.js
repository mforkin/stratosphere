var viz,
    data = createAggregatePoints();

viz = sonic.viz('#viz', data, {
    margin: {
        right: 0,
        left: 0,
        top: 0,
        bottom: 0
    }
})
.addPie();

//Event handler for when the Rnadomize Data button is pushed.
d3.select('#randomize').on('click', function () {
    data = createAggregatePoints();
    viz.data(data)
    updateDataDisplay(data);
});
updateDataDisplay(data);
