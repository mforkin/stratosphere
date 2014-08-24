# Sonic.js

d3.js based viz framework, built for speed and gold rings


## Why?

d3.js is an amazing visualization framework, and perfect for highly customized one-off visualizations.  However, when creating 
simpler, more re-usable visualizations, it can feel a bit tedious/over-complicated.

Enter Sonic:

* Follows the same d3 style you know and love
* Allows for the building/re-use of higher level building block components
* Uses a compositional, rather than specification, approach

The last point could use some explanation:

- Many viz frameworks say: "hey developer, pick one of these 6 viz types".
- Sonic says: "hey developer, here's a viz object - add building blocks onto it as needed"

The former works for well for simple vizes (which may be all you need), but needs to implement a dizzying amount of configuration 
options to offer flexibility (not to mention that you're out of luck if your chart type isn't one of the 6).  With Sonic, you are 
not confined by chart types - you simply take a viz object and add building blocks onto that as needed, which are as simple as custom 
svg shapes, etc. and complex as entire chart types.


## Using

Just grab either sonic.min.js (for production) or sonic.js (if you care to debug), drop it in your project somewhere, 
then reference it in a script tag.

```html
<script type="text/javascript" src="/path/to/sonic.js"></script>
```

Check out the examples dir to see how it can be used, but it generally goes something like this:

```javascript

var viz,
    data;  //can be 1D or 2D array or "d3.nest" array

//most common data input format is "d3.nest" array
data = [
    {
        key: 'firstSeries',
        color: 'red',
        values: [
            { id: '1', x: new Date(), y: 5 }
            //...
        ]
    },
    {
        key: 'secondSeries'
        values: [] //...
    }
];

//tell sonic to use a particular div id to render into, with some data
viz = sonic.viz('#elementId', data);

//add a bunch of components to base viz
viz.addXAxis({type: 'time'});
viz.addYAxis();
viz.addLines();

//and to update with new data
viz.data([10, 4, 7, 5, 1]);

//or to update a component, without changing data
viz.updateYAxis({
    ticks: {
        showLabels: false
    }
});

//or to change representation of data
viz.removeLines();
viz.addBars();

//or to add components associated with particular series in the data
viz.addLines({ seriesIndexes: 1 });
viz.addBars({ seriesKeys: ['bestKey', 'worstKey'] });

//or to add your own svg elements
viz.body().append('rect');

//not to mention plenty of other fun components like
viz.addPie();
viz.addPunches();
viz.addMatrix();
viz.addForecast();
viz.addCrosshair();
```

## Developing

Sonic is packaged using [yeoman](http://yeoman.io/), a popular tool in the javascript community used to easily manage packaging, 
dependencies, and build commands within the node.js (javascript server software) ecosystem.

Steps to get started:

1. Install node.js
    * Find platform and follow the simple directions from [here](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager)
        * Do not use apt-get, since it installs a very old version of node
1. Checkout sonic `git clone git@github.com:ccri/sonic.js.git` & `cd` to directory
1. Run `npm install` (maybe sudo needed) to install the project's
   build related dependencies
1. Run `npm install -g yo grunt bower` (maybe sudo needed) to install
   system wide build tools
1. Run `bower install` to install client side dependencies
1. ?
1. Profit!

After setting it up, you can:

- Run `grunt` to create new versions of sonic.js and sonic.min.js (which live in `/dist/` dir) from the various src files.
- Run `grunt server` to run a mini server for running examples, testing changes, etc.  As you make changes in src files, 
they'll automatically be pushed to `localhost:8000` and the page will live update with the latest.

To build a new component (e.g. a "ring" component)

1. Create a new file in the `src/` dir, e.g. `/src/ring.js`
1. Add that file to the `Gruntfile.js`, after the core files, and before the `end.js` file
1. Use the template below to get started, and then flesh it out from there:

```javascript
/**
 * Component Docs:
 * 
 * Ring component - Creates gold rings for Sonic to consume
 */
sonic.ring = function (viz, c) {
    //cmp instance variables...won't need much more than these
    var selection, //cmp d3 selection
        data, //cmp data (generally transformed from viz.data())
        config = { //cmp config
            /* Radius of rings */
            radius: 5,
            /* Color of rings */
            color: "gold"
        };
    
    /**
     * Constructor that actually renders the data into component form
     * 
     * Note that there are no separate add/update/remove rings methods - d3
     * will do those 3 actions as needed to transform old data to new
     */
    function ring(sel) {
        selection = sel; //update current d3 selection
        
        computeData(); //update data
        computeScales(); //compute scales
        //other fns that set things up
        
        //d3 rendering, generally something like:
        groups = sel.selectAll('selector...');
        groups.enter().append('g');
        groups.each(drawRing);
        groups.exit().remove();
    }
    
    //Public methods that can be called using sonic.ring.myFn();
    ring.update = function () {}; //calls constructor to update cmp
    ring.id = function () {}; //getter/setter for this cmp's id
    ring.mergeConfig = function () {}; //merge in config
    ring.handleEvent = function () {}; //handle viz wide events
    //other public methods
    
    //Private methods only can be used from within a component
    function computeData() {} //transform data from main viz data (viz.data())
    function computeScales() {} //set up scales associated with this component
    function drawRing() {} //drawRing for each series in data
    //other private methods
    
    //Merge passed in config
    line.mergeConfig(c);

    //register this component with viz registry
    viz.register('ring', ring);

    return ring;
};

//Package methods only can be used from within sonic (note naming convention)
sonic_ring_add = function (v, c) { //add ring cmp to viz v according to config c
    v.body().call(sonic.ring(v, c));
};
sonic_ring_update = function (v, p, c) { //update ring cmps matching params p to have config c
    v.find('ring', p).forEach(function (r) {
        r.mergeConfig(c);
        r.update();
    });
};
sonic_ring_helperFn = function (arg1, arg2) {}; //do something helpful that other cmps can use

//Public API Methods
//these make some of the package level methods available as part of viz obj (e.g. viz.addRings())
sonic_api.add('addRings', sonic_ring_add);
sonic_api.add('updateRings', sonic_ring_update);

```

## Releasing

When releasing sonic.js, grunt has built-in commands to update and tag the major (x.0.0), minor (0.y.0), or patch (0.0.z) versions. To do so:

1. Make sure everything is checked in that will go into the release.
1. Run `grunt release-patch`, `grunt release-minor`, or `grunt release-major` depending on the release level. This will do the following:
    * Bumps the version in both bower.json and package.json.
    * Performs a build.
    * Tags the code.
    * Commits the code.
    * Pushes the commit and tag to master.
1. Change other projects to depend on new sonic.js version
    * e.g. change sonic version in ccri-ui's `bower.json` to the new version (or master for development), then rebuild, commit changes, etc.

    

## Todos

1. Viz click handlers
    1. Right now, all vizes have a click handler and a clear link by
       default, but this should be opt-in.
    1. Can't remove clear link from vizes that don't make use of it
    1. Clear code should be moved out of core viz class
1. Facets / Better data input
    * Right now, it's easy to pass data in its nest form, then tell different components to use different dataKeys, but should
      be able to pass in flat array of objects, and tell a given component to facet off of a variable to get its data
1. Too much code duplication between components
1. Testing!
1. Still filling this section out...

License
=======
    Copyright 2014 Commonwealth Computer Research, Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
