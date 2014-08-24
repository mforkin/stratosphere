sonic.currency = {};

sonic.currency.format = function (d, opts) {
    var unit,
        format = ',';

    opts = opts || {};

    if (opts.decimals === undefined) {
        opts.decimals = 2;
    }

    if (d >= 1000000000) {
        unit = 'B';
        d = d / 1000000000;
    } else if (d >= 1000000) {
        unit = 'M';
        d = d / 1000000;
    } else if (d >= 1000) {
        unit = 'K';
        d = d / 1000;
    }

    if (opts.decimals !== undefined) {
        format = format + '.' + opts.decimals + 'f';
    }

    format = d3.format(format);

    return (opts.excludeDollar ? '' : '$') + format(d) + (unit || '');
};
