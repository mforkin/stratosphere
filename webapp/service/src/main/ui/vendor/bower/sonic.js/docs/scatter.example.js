var data,
    heatData,
    viz;

/**
* Create a random set of points and sort them into seriesKeys
* using utils.js functions
*/
data = createPoints('XY', 3, { symbol: true});
heatData = createHeatPoints();
data = data.map(function (s, i) {s.key = 'points' + i; return s;}).concat(heatData.map(function (s, i) {s.key = 'heat'+i; return s;}));

updateDataDisplay(data.map(function (d) { var dat = sonic.clone(d); dat.values = dat.values.slice(0, 25); return dat; }));

viz = sonic.viz('#viz', data, {
    margin: {
        right: 20,
        left: 60
    },
    visibleClear: true
})
.addXAxis({
    label: {
        text: 'X'
    }
})
.addYAxis({
    label: {
        text: 'Y'
    }
})
.addHeat({
    seriesKeys: /heat*/,
    zoom: true
})
.addPoints({
  seriesKeys: /point*/,
  tooltip: {
      buffer: {
          type: 'pixel',
          amount: 5
      }
  },
  zoom: true
})
.addCrosshair();

/**
* Randomize the data and update the vizes
*/
function randomize() {
    data = createPoints('XY', 3, {
        symbol: true
    });
    data = data.map(function (s, i) {s.key = 'points' + i; return s;}).concat(createHeatPoints().map(function (s, i) {s.key = 'heat'+i; return s;}));
    updateDataDisplay(data.map(function (d) { var dat = sonic.clone(d); dat.values = dat.values.slice(0, 25); return dat; }));
    viz.data(data);
};

//Event handler for when the Rnadomize Data button is pushed.
d3.select('#randomize').on('click', randomize);