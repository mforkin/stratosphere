var data = createHPieData(),
    viz;

updateDataDisplay(data);

viz = sonic.viz('#viz', data, {
    tooltip: true,
    padding: {
        left: 100
    }
})
.addHPie();

function randomize () {
    data = createHPieData();
    updateDataDisplay(data);
    viz.data(data);
}

d3.select('#randomize').on('click', randomize);