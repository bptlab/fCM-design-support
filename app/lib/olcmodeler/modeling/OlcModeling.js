import inherits from 'inherits';

import BaseModeling from 'diagram-js/lib/features/modeling/Modeling';

export default function OlcModeling(eventBus, elementFactory, commandStack) {
    BaseModeling.call(this, eventBus, elementFactory, commandStack);
}

inherits(OlcModeling, BaseModeling);

OlcModeling.$inject = [
    'eventBus',
    'elementFactory',
    'commandStack',
];

OlcModeling.prototype.getHandlers = function () {
    var handlers = BaseModeling.prototype.getHandlers.call(this);
    handlers['element.updateLabel'] = UpdateLabelHandler;

    return handlers;
};

function UpdateLabelHandler() {

}

UpdateLabelHandler.prototype.execute = function (context) {
    var { element, newLabel } = context;
    element.businessObject.name = newLabel;
    return element;
}

UpdateLabelHandler.prototype.revert = function (context) {
    //TODO implement at some point
}