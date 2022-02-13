import { namespace } from "../util/Util";

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

    this.locationOfElement = function(element) {
        return this.title; //Default implementation;
    }
}