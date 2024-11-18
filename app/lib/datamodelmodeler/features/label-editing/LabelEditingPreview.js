import {remove as svgRemove} from 'tiny-svg';
import {is} from '../../../common/util/ModelUtil';
import {getLabelAttr} from './LabelUtil';

var MARKER_HIDDEN = 'djs-element-hidden';


export default function LabelEditingPreview(
    eventBus, canvas) {


    var element, gfx;

    eventBus.on('directEditing.activate', function (context) {
        var activeProvider = context.active;
        var element = activeProvider.element;

        var editedAttribute = getLabelAttr(element);
        element = element.labels.filter(label => label.labelAttribute === editedAttribute)[0] || element.label || element;

        if (is(element, 'od:Association')) {
            var cardinality = element.labelAttribute;

            var label_text = element.businessObject[cardinality];

            if (!label_text.includes("⬨")) {
                var previewDiv = document.getElementsByClassName("djs-direct-editing-content")[0];

                previewDiv.innerHTML = label_text + " <br>⬨" + label_text;
            }
        }

        if (element.labelTarget) {
            canvas.addMarker(element, MARKER_HIDDEN);
        }
    });


    eventBus.on(['directEditing.complete', 'directEditing.cancel'], function (context) {
        var activeProvider = context.active;

        if (activeProvider) {
            canvas.removeMarker(activeProvider.element.label || activeProvider.element, MARKER_HIDDEN);
        }

        element = undefined;

        if (gfx) {
            svgRemove(gfx);

            gfx = undefined;
        }
    });
}

LabelEditingPreview.$inject = [
    'eventBus',
    'canvas'
];