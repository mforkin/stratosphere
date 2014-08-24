(function () {
    'use strict';

    d3.json('docs.json', function (data) {
        var tocCatTpl = _.template(
                document.getElementById('tocCategory').innerHTML
            ),
            catDetailTpl = _.template(
                document.getElementById('methodSection').innerHTML
            ),
            toc = d3.select('#toc'),
            main = d3.select('#main');
        
        _.each(data, function (methods, key) {
            
            // create the table of contents.
            //
            // TODO - logic to grab defaults.

            var methods = methods,
                render = {};

            _.each(methods, function (mConfig, methodName) {
                if(mConfig.config === 'defaults') {
                    mConfig.config = methods.defaults.config;
                }
                if(mConfig.example === 'defaults') {
                    mConfig.example = methods.defaults.example;
                }
            });
            
            var categoryData = {
                categoryName: key,
                methods: _.omit(methods, 'defaults')
            };

            toc.append('section')
                .html(tocCatTpl(categoryData));

            // create each api section
            main.append('section')
                .attr('class', 'api-detail')
                .html(catDetailTpl(categoryData));

        });

    });

}).call(this);



