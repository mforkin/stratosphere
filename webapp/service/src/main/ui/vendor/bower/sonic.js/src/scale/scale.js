/** Namespace for sonic scale related functions */
sonic.scale = {};

/**
 * Compute the domain (min/max) for a set of data (in nest form)
 *
 * @todo this should be able to take in seriesKeys/seriesIndexes config
 * and only use the appropiate series in computing the domain
 */
function sonic_scale_compute_base_domain(data, c) {
    var domain = [];

    data.forEach(function (series) {
        var td;

        if (c.series && c.series.indexOf(series.key) === -1) {
            return;
        }

        if (!sonic.isArray(series.values) || series.values.length === 0) {
            return;
        }

        td = d3.extent(series.values, function (d) {
            return d[c.dataKey];
        });

        if (sonic.isSet(td[0])) {
            if (!sonic.isSet(domain[0])) {
                domain[0] = td[0];
            } else {
                domain[0] = Math.min(td[0], domain[0]);
            }
        }

        if (sonic.isSet(td[1])) {
            if (!sonic.isSet(domain[1])) {
                domain[1] = td[1];
            } else {
                domain[1] = Math.max(td[1], domain[1]);
            }
        }
    });

    if (sonic.isSet(c.min) && c.min !== 'none') {
        domain[0] = c.min;
    }

    if (sonic.isSet(c.max)) {
        domain[1] = c.max;
    }

    return domain;
}

/**
 * Computes the pixel range for the scale. Auto-accounts for axis positioning
 *
 * @param {Object} scaleConfig the config passed when creating the axis
 */
function sonic_scale_compute_range(viz, pos, inRange) {
    var outRange;

    if (sonic.isArray(inRange)) {
        outRange = inRange.map(function (d) {
            var out = d,
                proportion;

            if (sonic.isString(d) || (sonic.isNumber(d) && d <= 1)) {
                if (sonic.isString(d) && d.match(/%/)) {
                    proportion = parseInt(d.replace(/%/, ''), 10) / 100;
                }

                if (sonic.isNumber(d)) {
                    proportion = d;
                }

                if (pos === 'left' || pos === 'right') {
                    out = proportion * viz.body().height();
                } else {
                    out = proportion * viz.body().width();
                }
            }

            return out;
        });

        // Side Y-Axis's need to reverse the range order due to axis orientation
        if (pos === 'left' || pos === 'right') {
            outRange = d3.permute(outRange, [1, 0]);
        }
    } else {
        if (pos === 'left' || pos === 'right') {
            outRange = [viz.body().height(), 0];
        } else {
            outRange = [0, viz.body().width()];
        }
    }

    return outRange;
}

/**
 * Get the extent of the range
 */
function sonic_scale_range_extent(scale) {
    return Math.abs(scale.rangeMax() - scale.rangeMin());
}

sonic_scale_add = function (v, c) {
    sonic.scale[c.type](v, c);
};

sonic_scale_add_linear = function (v, c) {
    sonic_scale_add(v, sonic.object.merge(
        c,
        { type: 'linear' }
    ));
};

sonic_scale_add_time = function (v, c) {
    sonic_scale_add(v, sonic.object.merge(
        c,
        { type: 'linear' }
    ));
};

sonic_scale_add_ordinal = function (v, c) {
    sonic_scale_add(v, sonic.object.merge(
        c,
        { type: 'linear' }
    ));
};

sonic_scale_update = function (v, p, c) {
    v.find('scale', p).forEach(function (d) {
        d.mergeConfig(c);
        d.update();
    });
};

sonic_scale_remove = function (v, p, c) {
    v.remove('scale', p);
};

sonic_api.add('addScale', sonic_scale_add);
sonic_api.add('addLinearScale', sonic_scale_add_linear);
sonic_api.add('addOrdinalScale', sonic_scale_add_ordinal);
sonic_api.add('addTimeScale', sonic_scale_add_time);
sonic_api.add('updateScale', sonic_scale_update);
sonic_api.add('removeScale', sonic_scale_remove);
