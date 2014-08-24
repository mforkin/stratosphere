/**
 * Adds legends to your viz
 * @TODO add toggling controls for whole legend and for individual series
 * the latter will probably require some refactoring
 */
sonic.legend = function (viz, initialConfig) {
    var p = {
        config: {
            /**
             * The legends to add. Example:
             * [
             *      {
             *          id: ['areachart', 'avgpriceline'],
             *          pos: [0.02, 0.55]
             *      },
             *      {
             *          id: ['sales' + this.getId(), 'products' + this.getId()],
             *          pos: [0.02, 0.05]
             *      }
             *  ]
             * where areachart and avgpriceline are ids of components to include
             * in the legend and pos is the positioning of the legend [x, y] as
             * percentages of the total viz height and width
             */
            legends: [],
            cls: '',
            style: {
                fill: 'white',
                stroke: 'black',
                opacity: 0.8,
                fontSize: '10px',
                font: 'sans-serif',
                fontColor: 'black',
                padding: 5
            }
        }
    };

    /**
     * Legend component
     */
    function legend(sel, opts) {
        //Remove and wait and add to ensure it is on top
        //@TODO find better way than delaying
        sel.selectAll('.sonic-legend.' + legend.id()).remove();
        p.selection = sel;
        setTimeout(function () {
            var classes = [p.config.cls, 'sonic-legend'],
                groups;
            p.selection = sel;

            p.computeData(opts || {});
            groups = sel.selectAll('.sonic-legend.' + legend.id())
                .data(p.data);

            groups.enter().append('g')
                .classed('sonic-legend ' + legend.id(), true)
                .style('font-size', p.config.style.fontSize)
                .style('font', p.config.style.font);

            groups.each(p.drawLegend);

            groups.order();

            groups.exit().remove();
        }, Math.max(viz.animation().duration * 2, 1000));
    }

    /**
     * Return empty to remove or legend data
     */
    p.computeData = function (opts) {
        p.data = [];
        if (opts.remove) {
            return;
        }
        p.data = p.config.legends;
    };

    /**
     * Draws a the legend
     */
    p.drawLegend = function (series) {
        var g = d3.select(this),
            lbbox,
            items = {},
            svg = viz.body(),
            ids = sonic.isArray(series.id) ? series.id : [series.id],
            legendPadding = p.config.style.padding,
            types = ids.map(function (id) { return id + '-data-legend'; }),
            applicableElements = svg.selectAll('[' + types.join('],[') + ']'),
            lb = g.selectAll(".legend-box").data(applicableElements[0].length > 0 ? [1] : []),
            li = g.selectAll(".legend-items").data(applicableElements[0].length > 0 ? [1] : []);

        g.attr('transform', 'translate(' + viz.body().width() * series.pos[0] + ',' + viz.body().height() * series.pos[1] + ')');

        lb.enter()
            .append("rect")
            .classed("legend-box", true)
            .style('fill', p.config.style.fill)
            .style('opacity', p.config.style.opacity)
            .style('stroke', p.config.style.stroke);
        li.enter()
            .append("g")
            .classed("legend-items", true);

        applicableElements.each(function (el) {
            var self = d3.select(this),
                type = types.filter(function (t) { return sonic.isSet(self.attr(t)); } )[0];
            items[self.attr(type)] = {
                pos: self.attr("data-legend-pos") || this.getBBox().y,
                color: sonic.isSet(self.attr("data-legend-color")) ? self.attr("data-legend-color") : self.style("fill") !== 'none' ? self.style("fill") : self.style("stroke")
            };
        });

        items = d3.entries(items).sort(function (a, b) { return a.value.pos - b.value.pos; });

        li.selectAll("text")
            .data(items, function(d) { return d.key; })
            .call(function(d) { d.enter().append("text"); })
            .call(function(d) { d.exit().remove(); })
            .attr("y", function(d,i) { return i + "em"; })
            .attr("x", "1em")
            .attr('fill', p.config.style.fontColor)
            .text(function(d) { return d.key; });

        li.selectAll("circle")
            .data(items, function(d) { return d.key; })
            .call(function(d) { d.enter().append("circle"); })
            .call(function(d) { d.exit().remove(); })
            .attr("cy",function(d,i) { return i - 0.25 + "em"; })
            .attr("cx", 0)
            .attr("r", "0.4em")
            .style("fill", function(d) { return d.value.color; });

        // Reposition and resize the box
        if (applicableElements[0].length > 0) {
            lbbox = li[0][0].getBBox();
            lb.attr("x", (lbbox.x - legendPadding))
                .attr("y", (lbbox.y - legendPadding))
                .attr("height", (lbbox.height + 2 * legendPadding))
                .attr("width", (lbbox.width + 2 * legendPadding));
        }

        li.exit().remove();
        lb.exit().remove();
    };

    sonic.augment(legend, p, viz, 'registerable');

    legend.mergeConfig(initialConfig);

    viz.register('sonic-legend', legend);

    return legend;
};

function sonic_legend_add (v, c) {
    v.body().call(sonic.legend(v, c));
}

function sonic_legend_remove(v, c) {
    v.remove('sonic-legend', c);
}

function sonic_legend_update(v, p, c) {
    v.find('sonic-legend', p).forEach(function (cmp) {
        cmp.mergeConfig(c);
        cmp.update();
    });
}

sonic_api.add('addLegend', sonic_legend_add);
sonic_api.add('updateLegend', sonic_legend_update);
sonic_api.add('removeLegend', sonic_legend_remove);