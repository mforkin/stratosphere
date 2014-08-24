var data,
    viz,
    numOfLines = 2; //keeps track of how many lines are currently on viz, begins with 2 on stacked axis

/**
* Creates a random set of points for each line and sorts them into seriesKeys
* used in the drawLine methods. This uses utils.js.
*/
data = createPoints();
data = sortToKeys(data);
updateDataDisplay(data);

/**
* Updates the axis with given id and changes its range.
*/
updateAnyYAxis = function (id, range) {
    viz.updateAxis({
        id: id
    }, {
        range: range
    });
}

/**
* Adds a new y-axis using the id, range, dataKay, and text label
* passed as params. Range will be [0,1] if adding a new axis to an
* empty viz. Otherwise the values will vary in percentages that add
* up to 1. The top of the y-axis starts at 0 and goes to the bottom (1).
* DataKey will either be y or y2 depending on which group of lines are
* being added.
*/
addAnyYAxis = function (id, range, dataKey, label) {
  viz.addYAxis ({
      id: id,
      range: range,
      dataKey: dataKey,
      label: {
          text: label
      }
  });
}

/**
* Reads in the id of the line and returns the text with
* appropriate spacing and capitalization.
*/
determineText = function (id) {
    var r;
    if (id === "line1and2") {
        r = "Line 1 and 2";
    } else {
        r = "Line 3";
    }

    return r;
}

/**
* Reads in the id of the line. Method is only called when moving
* to a stacked axis. Therefore, it returns what percentage of the axis
* that specific line takes up on the viz.
*/
determineRange = function (id) {
    var r;
    if (id === "line1and2") {
        r = [0, .75]; //top portion of the viz
    } else {
        r = [.75, 1]; // bottom portion of the viz
    }

    return r;
}

/**
* Adds the rule in between the two lines, separating the axes.
* Method is called when moving to a stacked axis format.
*/
addAnyRule = function () {
    viz.addRule ({
        id: 'yaxis-splitter',
        type: 'x',
        position: 0.75
    });
}

/**
* Adds a line using its id, seriesKeys (sKeys), and yDataKey.
*/
addAnyLine = function (id, sKeys, yDataKey) {
    viz.addLine ({
        id: id,
        seriesKeys: sKeys,
        yDataKey: yDataKey,
        sort: true,
        tooltip: {
            type: 'global'
        }
    });
}

/**
* Finds the seriesKeys. This is hardcoded to use ['a','b'] for line1and2
* and 'c' for line3. The keys are determined by the id.
*/
findSKeys = function(id) {
  var r;
  if (id === "line1and2") {
      r = ['a', 'b'];
  } else {
      r = 'c';
  }

  return r;
}

/**
* Using the id param, the dataKey is determined to either be 'y' or 'y2',
* depending on which id is read.
*/
findYDK = function (id) {
  var r;
  if (id === "line1and2") {
      r = 'y';
  } else {
      r = 'y2';
  }

  return r;
}

/**
* Method called whenever a line needs to be added to the viz, based on the checkboxes.
* idAdd holds the id of the line/axis to be added. idUpdate holds the id of the line/axis
* to be adjust. sKeys and yDk correspond with the line to be added. If the numOfLines is equal
* to 1 than the viz is moving to a stacked axis and must therefore add a rule and addjust the range
* to correct proportion. Otherwise, the viz was previously empty and just a line and axis need
* to be added.
*/
addToViz = function(idAdd, idUpdate, sKeys, yDk) {
  var textAdd = determineText(idAdd);

  if (numOfLines === 1) {
      rangeUpdate = determineRange(idUpdate);
      updateAnyYAxis(idUpdate, rangeUpdate);
      viz. updateLines ({
        id: idUpdate
      });

      rangeAdd = determineRange(idAdd);
      addAnyYAxis(idAdd, rangeAdd, yDK, textAdd);
      addAnyRule();
  } else {
      addAnyYAxis(idAdd, [0,1], yDK, textAdd);
  }

  addAnyLine(idAdd, sKeys, yDK);
  numOfLines += 1;
}

/**
* Method is called when a line needs to be removed from the viz, according to the checkboxes.
* If the viz was previously a stacked axis (numOfLines === 2), than the rule must also
* be removed and lines/axis must be updated.
*/
removeFromViz = function(removeLine, updateLine) {
  viz.removeAxis ({
    id: removeLine
  });
  viz.removeLine ({
    id: removeLine
  });
  //num of lines on the viz before removeFromViz was called
  if (numOfLines === 2) {
      viz.removeRule ({
          id: 'yaxis-splitter'
      });
      updateAnyYAxis(updateLine, [0,1]);
      viz.updateLines ({
          id: updateLine
      });

  }
  numOfLines -= 1;
}

/**
* Method called when the checkboxes are changed.
* if val is true, that means a box was checked and some line must be added.
* Otherwise, remove the line that was unchecked.
*/
changeAxis = function(id, id2, val) {

  if (val === true) {
      sKeys = findSKeys(id);
      yDK = findYDK(id);
      addToViz(id, id2, sKeys, yDK);
  } else {
      removeFromViz(id, id2);
  }

}

/**
* Draw a viz with 3 lines and a stacked axis.
*/
viz = sonic.viz('#viz', data, {
  tooltip: true
})
.addXAxis({
  type: 'time',
  label: {
      text: 'Date'
  }
});

addAnyYAxis('line1and2', [0, .75], 'y', 'Line 1 and 2');
addAnyYAxis('line3', [0.75, 1], 'y2', 'Line 3');
addAnyLine('line1and2', ['a','b'], 'y');
addAnyLine('line3', ['c'], 'y2');
addAnyRule();
viz.addCrosshair();

/**
* Called when the randomize button is selected. Creates a new set of
* data, sorts it, and than updates the viz.
*/
function randomize() {
    data = createPoints();
    data = sortToKeys(data);
    updateDataDisplay(data);
    viz.data(data);
}

//add listener to checkboxes and change axis accordingly.
d3.selectAll('input[name=line]').on('change', function(d, i) {
    var checkedId = this.defaultValue, // either line1and2 or line3
        checkedValue = this.checked, //either true (checked) or false (unchecked)
        otherId = "line1and2"; //default value of opposite id, checks below

    if (checkedId === "line1and2") {
      otherId = "line3";
    }

    changeAxis(checkedId, otherId, checkedValue);
});

//listener for randomize button.
d3.select('#randomize').on('click', randomize);