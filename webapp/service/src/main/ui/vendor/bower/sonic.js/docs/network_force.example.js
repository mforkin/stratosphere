var data,
    nodes = [],
    links = [],
    viz,
    personIndex = 10,
    linkIndex = 0;

nodes = getImageNodes();
links = getImageLinks();

//only cloning b\c we can't stringify circular references
//this is necessary to view data in docs
data = sonic.nest([sonic.clone(nodes), sonic.clone(links)]);

updateDataDisplay(data);

viz = sonic.viz('#viz', data, {
    tooltip: true
})
.addNetwork({
    nodeStyle: {
        colorBy: 'group'
    },
    networkForce: {
        gravity: 0.05,
        distance: 120,
        charge: -200
    }
});

/**
* Adds a new person data node to the graph
*/
function addPerson() {
    nodes.push({id: personIndex, name: 'Person ' + personIndex, height: 30, width: 30, image: "images/person-black.png", highlightImage: "images/person-red.png"});
    links.push({source: personIndex, target: linkIndex});
    personIndex++;
    linkIndex++;
    if (linkIndex > personIndex) {
        linkIndex = 0;
    }
    data = sonic.nest([sonic.clone(nodes), sonic.clone(links)]);
    updateDataDisplay(data);
    viz.data(data);
};

/**
* Change the network node's type from circles to images.
*/
function changeNodeType() {
    if (this.value === 'circles') {
        nodes = getCircleNodes();
        links = getCircleLinks();
        personIndex = 110,
        linkIndex = 100;
    } else {
        nodes = getImageNodes();
        links = getImageLinks();
        personIndex = 10,
        linkIndex = 0;
    }

    data = sonic.nest([sonic.clone(nodes), sonic.clone(links)]);
    updateDataDisplay(data);
    viz.data(data);
};

//add listener to switch between circles and images.
d3.selectAll('input[name=nodetype]').on('change', changeNodeType);

//Event handler for when the Add New Person button is clicked.
d3.select('#addPersonNode').on('click', addPerson);