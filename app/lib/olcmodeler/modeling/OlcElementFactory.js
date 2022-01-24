import {
    assign
} from 'min-dash';
import inherits from 'inherits';
import BaseElementFactory from 'diagram-js/lib/core/ElementFactory';

export default function OlcElementFactory(moddle, elementRegistry) {
    BaseElementFactory.call(this);
    this._moddle = moddle;
    this._elementRegistry = elementRegistry;
}

inherits(OlcElementFactory, BaseElementFactory);

OlcElementFactory.$inject = [
    'moddle',
    'elementRegistry'
];

var i = 0; //TODO replace with more sophisticated system

OlcElementFactory.prototype.createBusinessObject = function (type, attrs) {
    var element = this._moddle.create(type, attrs || {});
    if(!element.id) {
        var prefix = (element.$type || '').replace(/^[^:]*:/g, '') + '_';
        while (this._elementRegistry.get(element.id = prefix + i)) i++;
    }
    return element;
};

OlcElementFactory.prototype.baseCreate = BaseElementFactory.prototype.create;
OlcElementFactory.prototype.baseCreateShape = BaseElementFactory.prototype.createShape;

OlcElementFactory.prototype.createShape = function(attrs) {
    attrs = assign(defaultSizeForType(attrs.type), attrs);
    return this.baseCreateShape(attrs);
}

OlcElementFactory.prototype.create = function (elementType, attrs) {

    attrs = attrs || {};
    attrs = assign(defaultSizeForType(attrs.type), attrs);

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
        id: businessObject.id,
        size: defaultSizeForType(attrs.type)
    }, attrs);

    return this.baseCreate(elementType, attrs);
};

function defaultSizeForType(type) {
    return { width: 60, height: 60 };
}