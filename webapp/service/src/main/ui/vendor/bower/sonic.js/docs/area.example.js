var data,
    viz;

data = createPoints('consistentTime');
updateDataDisplay(data);

/**
 * Draw a line viz of count over time
 */
viz = sonic.viz('#viz', data, {
    visibleClear: true
})
.addXAxis({
    type: 'time',
    label: {
        text: 'Time'
    }
})
.addYAxis({
    min: 0,
    label: {
        text: 'Count'
    }
})
.addAreas({
    sort: true,
    fillOpacity: 0.6
});

/**
 * Change the area viz's type from
 * basic to stacked or vice-versa
 */
function changeAreaType() {
    viz.updateAreas({}, {
        type: this.value
    });
};

/**
* Randomize the data and update the vizes
*/
function randomize() {
    data = createPoints('consistentTime');
    viz.data(data);
    updateDataDisplay(data);
};

//add listener to bar viz type switcher radio button and update bars accordingly
d3.selectAll('input[name=area]').on('change', changeAreaType);

//Event handler for when the Randomize Data button is pushed.
d3.select('#randomize').on('click', randomize);