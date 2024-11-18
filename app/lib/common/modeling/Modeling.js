import inherits from 'inherits';

import BaseModeling from 'diagram-js/lib/features/modeling/Modeling';

export default function Modeling(eventBus, elementFactory, commandStack) {
    BaseModeling.call(this, eventBus, elementFactory, commandStack);

    eventBus.on('copyPaste.copyElement', function (context) {
        context.descriptor.copiedBusinessObject = context.element.businessObject;
        context.descriptor.type = context.descriptor.copiedBusinessObject.$type;
    });

    eventBus.on('copyPaste.pasteElement', function (context) {
        const {copiedBusinessObject} = context.descriptor;
        const newAttrs = {
            name: copiedBusinessObject.name
        }
        context.descriptor.businessObject = elementFactory.createBusinessObject(copiedBusinessObject.$type, newAttrs);
    });
}

inherits(Modeling, BaseModeling);

Modeling.$inject = [
    'eventBus',
    'elementFactory',
    'commandStack',
];

Modeling.prototype.updateLabel = function (element, newLabel, newBounds, hints) {
    this._commandStack.execute('element.updateLabel', {
        element: element,
        newLabel: newLabel,
        newBounds: newBounds,
        hints: hints || {}
    });
};

Modeling.prototype.getHandlers = function () {
    var handlers = BaseModeling.prototype.getHandlers.call(this);
    handlers['element.updateLabel'] = UpdateLabelHandler;

    return handlers;
};

function UpdateLabelHandler() {

}

UpdateLabelHandler.prototype.execute = function (context) {
    var {element, newLabel} = context;
    element.businessObject.name = newLabel;
    return element;
}

UpdateLabelHandler.prototype.revert = function (context) {
    //TODO implement at some point
}