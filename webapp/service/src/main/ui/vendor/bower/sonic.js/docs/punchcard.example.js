var data,
    colors = d3.scale.category20(),
    viz;

function assignColors (data) {
    data.forEach(function (d) {
        d.values.forEach(function (v) {
            v.color = colors(Math.floor(v.t) % colors.range().length);
        });
    });
}

/**
* Create a random set of points and sort them into seriesKeys
* using utils.js functions
*/
data = createMatrixPoints();
assignColors(data);

updateDataDisplay(data[0].values.slice(0, 25));

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
    type: 'ordinal',
    label: {
        text: 'Groups'
    }
})
.addYAxis({
    type: 'ordinal',
    label: {
        text: 'Other Groups'
    }
})
.addPunches()
.addCrosshair({
    offset: {
        length: -5
    },
    length: 10,
    strokeWidth: 3
});

/**
* Randomize the data and update the vizes
*/
function randomize() {
    data = createMatrixPoints();
    assignColors(data);
    viz.data(data);
    updateDataDisplay(data[0].values.slice(0, 25));
};

//Event handler for when the Rnadomize Data button is pushed.
d3.select('#randomize').on('click', randomize);