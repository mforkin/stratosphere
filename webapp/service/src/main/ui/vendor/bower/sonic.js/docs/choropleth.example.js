var data,
    topology,
    viz;

//async (but parallel) load of usa topology + unemployment data and
//when done, load viz
queue()
    .defer(d3.json, 'data/usa-states-and-counties.json')
    .defer(d3.tsv, 'data/unemployment.tsv')
    .await(function (error, topo, unemployment) {
        topology = topo;
        data = unemployment.map(function (d) {
            return {
                countyId: parseInt(d.id, 10),
                val: parseFloat(d.rate)
            };
        });
        drawViz();
        updateDataDisplay(data[0].values.slice(0, 25));
    });


function drawViz() {
    viz = sonic.viz('#viz', data, {
        margin: {
            right: 0,
            bottom: 0,
            left: 50,
            top: 0
        }
    })
    .addChoropleth({
        baseGeos: {
            types: ['counties', 'states'],
            topology: topology
        }
    });
}