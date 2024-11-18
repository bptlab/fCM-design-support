import {assign} from 'min-dash';
import inherits from 'inherits';
import Ids from 'ids';
import BaseElementFactory from 'diagram-js/lib/core/ElementFactory';

export default function DepElementFactory(moddle, elementRegistry) {
    BaseElementFactory.call(this);
    this._moddle = moddle;
    this._elementRegistry = elementRegistry;
    this._ids = new Ids();
}

inherits(DepElementFactory, BaseElementFactory);

DepElementFactory.$inject = [
    'moddle',
    'elementRegistry'
];

DepElementFactory.prototype.createBusinessObject = function (type, attrs) {
    const element = this._moddle.create(type, attrs || {});
    if (!element.name) {
        element.name = 'undefined'
    }
    if (!element.id) {
        const prefix = (element.$type || '').replace(/^[^:]*:/g, '') + '_';
        element.id = this._ids.nextPrefixed(prefix, element);
    } else if (this._ids.assigned(element.id)) {
        throw new Error('Cannot create element, id "' + element.id + '" already exists');
    }

    return element;
}

DepElementFactory.prototype.baseCreate = BaseElementFactory.prototype.create;
DepElementFactory.prototype.baseCreateShape = BaseElementFactory.prototype.createShape;

DepElementFactory.prototype.createShape = function (attrs) {
    attrs = assign(this.defaultSizeForType(attrs.type), attrs);

    return this.baseCreateShape(attrs);
}

DepElementFactory.prototype.create = function (elementType, attrs) {
    attrs = attrs || {};
    attrs = assign(this.defaultSizeForType(attrs.type), attrs);
    var businessObject = attrs.businessObject;

    if (!businessObject) {
        if (!attrs.type) {
            throw new Error('no element type specified');
        }
        var businessAttrs = assign({}, attrs);
        delete businessAttrs.width;
        delete businessAttrs.height;
        businessObject = this.createBusinessObject(businessAttrs.type, businessAttrs);
    }
    attrs = assign({
        businessObject: businessObject,
        id: businessObject.id
    }, attrs);

    return this.baseCreate(elementType, attrs);
}

DepElementFactory.prototype.defaultSizeForType = function () {
    return {width: 100, height: 100};
}
