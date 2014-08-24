/**
 * The registerable mixin provide base component functionality necessary to
 * register a component.
 *
 * Properties and methods attached to public or private will be injected into
 * the public or private variable within the mixers scope (the convention is that
 * the mixer will eventually hide its private properties). Properties attached
 * to this mixin's self named var (in our case registerable) will be attached to
 * the mixer itself and will be directly accessible to anyone with a reference
 * to mixer
 */
sonic.registerable = function (cmp, p, viz) {
    var registerable = {},
        private = {
            data: [],
            selection: null,
            config: {
                id: null
            }
        };

    /**
     * A getter/setter for the id
     */
    registerable.id = function (val) {
        return sonic.getOrSet('id', val, p.config, cmp);
    };

    /**
     * A function to merge configuration into our public vars. This allows
     * users to set and adjust configuration options.
     * @TODO investigate the need to also merge this into the initial config
     * variable in components. This would require attaching the config variable
     * to the component to gain access to it here.
     */
    registerable.mergeConfig = function (conf) {
        sonic.object.merge(p.config, conf);
    };

    /**
     * Updates a component by applying the components main function to the
     * selection. If new config has been passed, it is merged in.
     */
    registerable.update = function (c) {
        var opts = {
            update: true
        };

        if (sonic.isSet(c)) {
            if (c.type !== p.config.type) {
                opts.from = c.type;
            }

            registerable.mergeConfig(c);
        }

        p.selection.call(cmp, opts);
    };

    /**
     * Removes a component by applying the components main function to the
     * selection with the remove flag set to true
     */
    registerable.remove = function () {
        p.selection.call(cmp, {remove: true});
    };

    /**
     * Checks whether the component has content by inspecting the amount
     * of data it currently has.
     */
    registerable.hasContent = function () {
        return p.data.length > 0;
    };

    sonic.object.equalize(private, p);

    return registerable;
};