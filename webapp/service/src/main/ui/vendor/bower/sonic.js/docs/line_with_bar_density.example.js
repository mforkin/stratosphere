var data,
    viz;

data = createPoints();
data = sortToKeys(data);

//creates viz
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
        text: 'Millisecs'
    }
})
.addYAxis({
    dataKey: 'y2',
    label: {
        text: 'Count of rxBytes'
    }
})
.addLine({
    seriesKeys: ['b'],
    yDataKey: 'y2',
    sort: true,
    tooltip: {
        type: 'global'
    }
})
//adds Bars using the same line data (seriesKeys) so that a bar of width
// 1 will appear below each point graphed in addLine
.addBars({
    yDataKey: 'y2',
    seriesKeys: ['b'],
    barWidth: 1,
    minBarWidth: 1,
    animation: {
        // duration: 0,
        // delay: 0
    },
    tooltip: {
        type: 'global'
    }
})
.addCrosshair();


updateDataDisplay(data);