import {getLabel, getLabelAttr, setLabel} from '../LabelUtil';

import {getExternalLabelMid, hasExternalLabel, isLabel, isLabelExternal} from '../../../util/LabelUtil';

var NULL_DIMENSIONS = {
    width: 0,
    height: 0
};


/**
 * A handler that updates the text of a postit element.
 */
export default function UpdateLabelHandler(modeling, textRenderer) {

    /**
     * Set the label and return the changed elements.
     *
     * Element parameter can be label itself or connection (i.e. sequence flow).
     *
     * @param {djs.model.Base} element
     * @param {String} text
     */
    function setText(element, text, oldText = '') {

        if (text == null) {
            text = oldText;
        }

        // Text can be set to null on deletion
        if (text !== null && element.businessObject.$type == 'od:Association') {
            // check if text fulfills required form
            const check_re_1 = /^\d+..(\d+|\*)\n⬨\d+..(\d+|\*)$/;
            const check_re_2 = /^\d+..(\d+|\*)$/;

            if (!(text.match(check_re_1)) && !(text.match(check_re_2))) {
                text = oldText;
            }

            const text_parts = text.split('\n⬨');
            if (text_parts[0] == text_parts[1]) {
                text = text_parts[0];
            }

        }

        // Check format for Attribute labels
        if (text !== null && element.businessObject.$type == 'od:Class' && element.businessObject.labelAttribute === 'attributeValues') {
            var check_re_class = /[A-Za-z]+: string|String|integer|Integer|int|Int|Str|str|Float|float|Boolean|boolean|bool|Bool$/
            if (!text.match(check_re_class)) {
                text = oldText;
            }
        }

        // external label if present
        var editedAttribute = getLabelAttr(element);
        var label = element.labels.filter(label => label.labelAttribute === editedAttribute)[0] || element.label || element;

        var labelTarget = element.labelTarget || element;

        setLabel(label, text, labelTarget !== label);

        return [label, labelTarget];
    }

    function preExecute(ctx) {
        var element = ctx.element,
            businessObject = element.businessObject,
            newLabel = ctx.newLabel;

        if (!isLabel(element)
            && isLabelExternal(element)
            && !hasExternalLabel(element)
            && !isEmptyText(newLabel)) {

            // create label
            var paddingTop = 7;

            var labelCenter = getExternalLabelMid(element);

            labelCenter = {
                x: labelCenter.x,
                y: labelCenter.y + paddingTop
            };

            modeling.createLabel(element, labelCenter, {
                id: businessObject.id + '_label',
                businessObject: businessObject
            });
        }
    }

    function execute(ctx) {
        ctx.oldLabel = getLabel(ctx.element);
        return setText(ctx.element, ctx.newLabel, ctx.oldLabel);
    }

    function revert(ctx) {
        return setText(ctx.element, ctx.oldLabel);
    }

    function postExecute(ctx) {
        var element = ctx.element,
            label = element.label || element,
            newLabel = ctx.newLabel,
            newBounds = ctx.newBounds,
            hints = ctx.hints || {};

        // ignore internal labels for elements
        if (!isLabel(label)) {
            return;
        }

        ctx.oldLabel = getLabel(ctx.element);

        if (isEmptyText(newLabel)) {
            newLabel = ctx.oldLabel;
        }

        if (isLabel(label) && isEmptyText(newLabel)) {

            if (hints.removeShape !== false) {
                modeling.removeShape(label, {unsetLabel: false});
            }

            return;
        }

        var text = getLabel(label);

        // resize element based on label _or_ pre-defined bounds
        if (typeof newBounds === 'undefined') {
            newBounds = textRenderer.getExternalLabelBounds(label, text);
        }

        // setting newBounds to false or _null_ will
        // disable the postExecute resize operation
        if (newBounds) {
            modeling.resizeShape(label, newBounds, NULL_DIMENSIONS);
        }
    }

    // API

    this.preExecute = preExecute;
    this.execute = execute;
    this.revert = revert;
    this.postExecute = postExecute;
}

UpdateLabelHandler.$inject = [
    'modeling',
    'textRenderer'
];


// helpers ///////////////////////

function isEmptyText(label) {
    return !label || !label.trim();
}