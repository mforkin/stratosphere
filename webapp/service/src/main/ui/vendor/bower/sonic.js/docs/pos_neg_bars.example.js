var data = generateData(),
    viz;

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
          text: 'X Label'
      },
      pinTo: {
        scale: 'y',
        value: 0
      }
  })
  .addYAxis({
      label: {
          text: 'Count'
      },
      min: 0,
      range: [0, 0.5]
  })
  .addYAxis({
    dataKey: 'ny',
    label: {
        text: 'Count 2'
    },
    range: [0.5, 1],
    max: 0
  })
  .addBars({
    seriesKeys: ['pos'],
    fill: 'green',
    tooltip: 'global'
  })
  .addBars({
    yDataKey: 'ny',
    seriesKeys: ['neg'],
    fill: 'red',
    tooltip: 'global'
  })
  .addCrosshair();

updateDataDisplay(data);

function generateData () {
    return [
        {
            key: 'pos',
            values: [
                {
                    id: 1,
                    x: 0,
                    y:100,
                    y0: 0
                },
                {
                    id: 2,
                    x: 1,
                    y:40,
                    y0: 0
                },
                {
                    id: 3,
                    x: 2,
                    y:70,
                    y0: 0
                },
                {
                    id: 4,
                    x: 3,
                    y:150,
                    y0: 0
                },
                {
                    id: 5,
                    x: 4,
                    y:130,
                    y0: 0
                }
            ]
        },
        {
            key: 'neg',
            values: [
                {
                    id: 6,
                    x: 0,
                    ny: -7,
                    y0: 0
                },
                {
                    id: 7,
                    x: 1,
                    ny: -4,
                    y0: 0
                },
                {
                    id: 8,
                    x: 2,
                    ny: -8,
                    y0: 0
                },
                {
                    id: 9,
                    x: 3,
                    ny: -20,
                    y0: 0
                },
                {
                    id: 10,
                    x: 4,
                    ny: -10,
                    y0: 0
                }
            ]
        }
    ];
}
/**
* Randomize the data and update the vizes
*/
/*function randomize() {
  data = createPoints();
  viz.data(data);
    updateDataDisplay(data);
};*/

//Event handler for when the Rnadomize Data button is pushed.
//d3.select('#randomize').on('click', randomize);