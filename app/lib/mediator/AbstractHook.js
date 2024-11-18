import {namespace} from "../util/Util";

/**
 * Makes the hook interface explicit
 */
export default function AbstractHook(modeler, title, wikilink) {

    this.modeler = modeler;
    this.title = title;
    this.wikilink = wikilink;

    this.getNamespace = function () {
        return this.modeler.get && namespace(this.modeler.get('canvas').getRootElement());
    }

    this.getRootObject = function () {
        return this.modeler.get && this.modeler.get('canvas').getRootElement().businessObject;
    }

    this.locationOfElement = function (element) {
        return this.title; //Default implementation;
    }

    this.getGraphics = function (element) {
        const modeler = this.modeler;
        return element !== this.getRootObject() ?
            modeler.get('elementRegistry').getGraphics(element.id)
            : modeler.get('canvas').getContainer().closest('.canvas');
    }

    this.focusElement = function (element) {
        if (!this.modeler.get('elementRegistry').get(element.id)) {
            this.modeler.ensureElementIsOnCanvas(element);
        }
        const visual = this.modeler.get('elementRegistry').get(element.id);
        if (!visual) {
            throw new Error('Cannot focus element ' + element + '. It is not on canvas');
        }
        const canvas = this.modeler.get('canvas');
        canvas.scroll({}); // Initialize stuff for scrolling, otherwise it only works at second attempt
        const viewbox = canvas.viewbox();
        canvas.scrollToElement(element.id, {
            top: (viewbox.height - visual.height) * viewbox.scale / 2,
            left: (viewbox.width - visual.width) * viewbox.scale / 2,
            bottom: (viewbox.height - visual.height) * viewbox.scale / 2,
            right: (viewbox.width - visual.width) * viewbox.scale / 2,
        });
    }
}