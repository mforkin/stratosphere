var viz,
    data = createGroupPoints();

/**
 * Draw a bar viz of count of groups.
 *
 * @todo fix bug related to using non-numbers as a x data keys
 * @todo implement faceting so that data doesn't need to be summed itself
 */
viz = sonic.viz('#viz', data, {
    tooltip: true
})
.addXAxis({
    type: 'ordinal',
    label: {
        text: 'Group'
    }
})
.addYAxis({
    label: {
        text: 'Count'
    },
    min: 0
})
.addBars();

/**
 * Change the bar viz's type from
 * grouped to stacked or vice-versa
 */
function changeBarType() {
    viz.updateBars({}, {
        type: this.value
    });
};

/**
 * Randomizes data for the bar graph and redraws.
 */
function randomize() {
    data = createGroupPoints();
    viz.data(data);
    createGroupPoints(data);
};

updateDataDisplay(data);
//add listener to bar viz type switcher radio button and update bars accordingly
d3.selectAll('input[name=bar]').on('change', changeBarType);

d3.select('#randomize').on('click', randomize);