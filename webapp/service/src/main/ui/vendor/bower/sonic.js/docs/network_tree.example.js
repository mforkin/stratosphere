var data,
    viz;

data = getNetworkTreeData();

updateDataDisplay(data);

/**
* Draw a network graph with given data
*/
viz = sonic.viz('#viz', data, {
    animation: {
        duration: 3000
    },
    tooltip: true
})
.addTree({
    verticalTree: false
});

/**
* Randomize the data and update the viz
*/
function colorByGroup() {
    viz.updateTree({}, {
        nodeStyle: {
            colorBy: 'group'
        }
    });
}

function colorByDepth() {
    viz.updateTree({}, {
        nodeStyle: {
            colorBy: 'depth'
        }
    });
}

function randomize() {
    var data = createTreeData();
    updateDataDisplay(data);
    viz.data(data);
}

function changeCollapsibleType() {
    if (this.value === 'true') {
        viz.updateTree({}, {
            collapsible: true
        });
        randomize();
    } else {
        viz.updateTree({}, {
            collapsible: false
        });
        randomize();
    }
};

//add listener to switch between collapsible and non-collapsible.
d3.selectAll('input[name=collapsible]').on('change', changeCollapsibleType);
//Event handler for when the Randomize Data button is pushed.
d3.select('#colorByGroup').on('click', colorByGroup);
d3.select('#colorByDepth').on('click', colorByDepth);
d3.select('#randomize').on('click', randomize);