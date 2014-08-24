var viz,
    groups = ['A', 'B', 'C', 'D', 'E'],
    data = computeBarData();

/**
* Draw a bar viz of count of groups.
*/
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
        text: 'Date'
    }
})
.addYAxis({
    type: 'ordinal',
    label: {
        text: 'Group'
    }
})
.addSignificanceBars({
    low: {
        color: '#82CAFF',
        threshold: -.25
    },
    high: {
        color: '#4AA02C',
        threshold: .25
    }
});


/**
* Computes a randomized set of data and nests the data via
* the group name.
*/
function computeBarData() {
    var nest = d3.nest(),
        data = [],
        point,
        initData = createPoints("Significance", 1, {groups: groups});

    initData.map(function (s) {
        s.values = s.values.sort(sonic.sortByProp('group', false));
        s.values = s.values.map(function (x) {
            data.push(x);
        });
        return data;
    });

    nest.key(function (d) {
        return d.y;
    });

    data = nest.entries(data);
    updateDataDisplay(data);
    return data;
}

/**
* Randomizes data for the bar graph and redraws.
*/
function randomize() {
    viz.data(computeBarData());
};

d3.select('#randomize').on('click', randomize);