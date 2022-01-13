import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import inherits from 'inherits';
import { is } from '../datamodelmodeler/util/ModelUtil';
import OlcEvents from '../olcmodeler/OlcEvents';

export default function Mediator() {
    [this.OlcModelerHook, this.DataModelerHook, this.FragmentModelerHook, this.GoalStateModelerHook].forEach(hook => {
        hook.mediator = this
    });
}

Mediator.prototype.addedState = function (event) {
    var state = event.context.shape.businessObject;
    var clazz = state.$parent;
    console.log('added state named \"', state.name, '\" with id \"', state.id, '\" to class named \"', clazz.name, '\" with id \"', clazz.id, "\"");
}

Mediator.prototype.deletedState = function (event) {
    var state = event.context.shape.businessObject;
    var clazz = state.$parent;
    console.log('removed state named \"', state.name, '\" with id \"', state.id, '\" from class named \"', clazz.name, '\" with id \"', clazz.id, "\"");
}

Mediator.prototype.renamedState = function (olcState) {
    this.goalStateModelerHook._goalStateModeler.handleStateRenamed(olcState);
}

Mediator.prototype.olcListChanged = function (olcs) {
    this.goalStateModelerHook._goalStateModeler.handleOlcListChanged(olcs);
}

// === Olc Modeler Hook
Mediator.prototype.OlcModelerHook = function (eventBus, olcModeler) {
    CommandInterceptor.call(this, eventBus);
    this.mediator = this.__proto__.constructor.mediator;
    this.mediator.olcModelerHook = this;
    this._eventBus = eventBus;
    this.olcModeler = olcModeler;

    this.executed([
        'shape.create'
    ], event => {
        if (is(event.context.shape, 'olc:State')) {
            this.mediator.addedState(event);
        }
    });
    this.executed([
        'shape.delete'
    ], event => {
        if (is(event.context.shape, 'olc:State')) {
            this.mediator.deletedState(event);
        }
    });

    this.executed([
        'element.updateLabel'
    ], event => {
        if (is(event.context.element, 'olc:State')) {
           this.mediator.renamedState(event.context.element.businessObject);
        }
    });

    this.reverted([
        'element.updateLabel'
    ], event => {
        if (is(event.context.element, 'olc:State')) {
           this.mediator.renamedState(event.context.element.businessObject);
        }
    });

    eventBus.on(OlcEvents.DEFINITIONS_CHANGED, event => {
        this.mediator.olcListChanged(event.definitions.olcs);
    });
}
inherits(Mediator.prototype.OlcModelerHook, CommandInterceptor);

Mediator.prototype.OlcModelerHook.$inject = [
    'eventBus',
    'olcModeler'
];

// === Data Modeler Hook
Mediator.prototype.DataModelerHook = function (eventBus, dataModeler) {
    CommandInterceptor.call(this, eventBus);
    this.mediator = this.__proto__.constructor.mediator;
    this.mediator.dataModelerHook = this;
    this._eventBus = eventBus;
    this.dataModeler = dataModeler;
}
inherits(Mediator.prototype.DataModelerHook, CommandInterceptor);

Mediator.prototype.DataModelerHook.$inject = [
    'eventBus',
    'dataModeler'
];

// === Fragment Modeler Hook
Mediator.prototype.FragmentModelerHook = function (eventBus, fragmentModeler) {
    CommandInterceptor.call(this, eventBus);
    this.mediator = this.__proto__.constructor.mediator;
    this.mediator.fragmentModelerHook = this;
    this._eventBus = eventBus;
    this.fragmentModeler = fragmentModeler;
}
inherits(Mediator.prototype.FragmentModelerHook, CommandInterceptor);

Mediator.prototype.FragmentModelerHook.$inject = [
    'eventBus',
    'fragmentModeler'
];

// === Goal State Modeler Hook
Mediator.prototype.GoalStateModelerHook = function(goalStateModeler) {
    this.mediator = this.__proto__.constructor.mediator;
    this._goalStateModeler = goalStateModeler;
    this.mediator.goalStateModelerHook = this;
}