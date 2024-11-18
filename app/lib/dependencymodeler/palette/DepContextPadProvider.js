import {is} from "../../util/Util";

export default function DepContextPadProvider(connect, contextPad, modeling, elementFactory, create, autoPlace, elementRegistry) {
    this._connect = connect;
    this._modeling = modeling;
    this._elementFactory = elementFactory;
    this._create = create;
    this._autoPlace = autoPlace;
    this._elementRegistry = elementRegistry;

    contextPad.registerProvider(this);
}

DepContextPadProvider.$inject = [
    'connect',
    'contextPad',
    'modeling',
    'elementFactory',
    'create',
    'autoPlace',
    'elementRegistry'
];

DepContextPadProvider.prototype.getContextPadEntries = function (element) {
    var connect = this._connect,
        modeling = this._modeling,
        elementFactory = this._elementFactory,
        create = this._create,
        autoPlace = this._autoPlace

    function removeElement() {
        modeling.removeElements([element]);
    }

    function startConnect(event, element, autoActivate) {
        connect.start(event, element, autoActivate);
    }

    function appendObjective(event, element) {
        const shape = elementFactory.createShape({type: 'dep:Objective'});
        autoPlace.append(element, shape, {connection: {type: 'dep:Dependency'}});
    }

    function appendObjectiveStart(event) {
        const shape = elementFactory.createShape({type: 'dep:Objective'});
        create.start(event, shape, {source: element});
    }

    const entries = {};

    if (element.id !== 'start_state') {
        entries['delete'] = {
            group: 'edit',
            className: 'bpmn-icon-trash',
            title: 'Remove',
            action: {
                click: removeElement,
                dragstart: removeElement
            }
        }
    }
    if (is(element, 'dep:Objective')) {
        entries['connect'] = {
            group: 'edit',
            className: 'bpmn-icon-connection',
            title: 'Connect',
            action: {
                click: startConnect,
                dragstart: startConnect
            }
        }
        entries['append'] = {
            group: 'create',
            className: 'bpmn-icon-start-event-none',
            title: 'Append Objective',
            action: {
                click: appendObjective,
                dragstart: appendObjectiveStart
            }
        }
    }

    return entries;
}