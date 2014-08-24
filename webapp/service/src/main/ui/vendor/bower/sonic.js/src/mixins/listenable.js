/**
 * The listenable mixin. Use this mixin if you want your component to respond
 * to the vizbodywide listeners.
 */
sonic.listenable = function (cmp, p, viz) {
    var listenable = {},
        private = {
            config: {}
        };

    /**
     * Handles events fired by the viz and calls the mixers appropriate handler
     * @TODO provide ability to extend this class or maybe better is to just
     * add and else to call a custom handler
     */
    listenable.handleEvent = function (sel, ev, mouse) {
        var result;

        if (sel === 'vizbodywide') {
            if (ev === 'mousemove') {
                result = p.onVizMouseMove ? p.onVizMouseMove(mouse) : null;
            } else if (ev === 'mouseout') {
                result = p.onVizMouseMove ? p.onVizMouseMove() : null;
            } else if (ev === 'click') {
                result = p.onVizClick ? p.onVizClick(mouse) : null;
            }
        } else if (sel === '.clear-link' && ev === 'click') {
            result = p.onVizClick ? p.onVizClick() : null;
        }

        return result;
    };

    /**
     * Checks if there were any closest points or a mouse on the mouse move
     * if so it tells the viz to update the tooltip appropriately
     * NOTE this function MUST be defined on the private variable and fn content
     * should reference p
     */
    private.updateTooltips = function (mouse, cps) {
        var renderFn = p.renderTooltips;

        if (p.config.tooltip && p.config.tooltip.renderFn) {
            renderFn = p.config.tooltip.renderFn;
        }

        if (p.config.tooltip) {
            if (mouse && cps && cps.length > 0) {
                p.config.tooltip.closestPoints = cps;
                p.config.tooltip.content = renderFn(cps, mouse);
                p.config.tooltip.associatedId = cmp.id();
                p.config.tooltip.mouse = mouse;

                viz.showTooltip(p.config.tooltip);
            } else {
                viz.hideTooltip(p.config.tooltip);
            }
        }
    };

    sonic.object.equalize(private, p);

    return listenable;
};