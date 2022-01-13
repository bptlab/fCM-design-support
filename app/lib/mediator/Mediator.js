import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import inherits from 'inherits';
import { is } from '../datamodelmodeler/util/ModelUtil';
import OlcEvents from '../olcmodeler/OlcEvents';

export default function Mediator() {
    [this.OlcModelerHook, this.DataModelerHook, this.FragmentModelerHook, this.GoalStateModelerHook].forEach(hook => {
        hook.mediator = this
    });
}

Mediator.prototype.addedState = function (olcState) {
    var clazz = olcState.$parent;
    console.log('added state named \"', olcState.name, '\" with id \"', olcState.id, '\" to class named \"', clazz.name, '\" with id \"', clazz.id, "\"");
}

Mediator.prototype.deletedState = function (olcState) {
    var clazz = olcState.$parent;
    console.log('removed state named \"', olcState.name, '\" with id \"', olcState.id, '\" from class named \"', clazz.name, '\" with id \"', clazz.id, "\"");
    this.fragmentModelerHook.fragmentModeler.handleStateDeleted(olcState);
}

Mediator.prototype.renamedState = function (olcState) {
    this.goalStateModelerHook.goalStateModeler.handleStateRenamed(olcState);
    this.fragmentModelerHook.fragmentModeler.handleStateRenamed(olcState);
}

Mediator.prototype.olcListChanged = function (olcs) {
    this.goalStateModelerHook.goalStateModeler.handleOlcListChanged(olcs);
    this.fragmentModelerHook.fragmentModeler.handleOlcListChanged(olcs);
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
            this.mediator.addedState(event.context.shape.businessObject);
        }
    });
    this.executed([
        'shape.delete'
    ], event => {
        if (is(event.context.shape, 'olc:State')) {
            this.mediator.deletedState(event.context.shape.businessObject);
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

    this.executed([
        'shape.create'
    ], event => {
        if (is(event.context.shape, 'od:Class')) {
            console.log(event);
            //this.mediator.addedState(event.context.shape.businessObject);
        }
    });

    this.reverted([
        'shape.create'
    ], event => {
        if (is(event.context.shape, 'od:Class')) {
            console.log(event);
            //this.mediator.addedState(event.context.shape.businessObject);
        }
    });

    this.executed([
        'shape.delete'
    ], event => {
        if (is(event.context.shape, 'od:Class')) {
            console.log(event);
            //this.mediator.deletedState(event.context.shape.businessObject);
        }
    });

    this.reverted([
        'shape.delete'
    ], event => {
        if (is(event.context.shape, 'od:Class')) {
            console.log(event);
            //this.mediator.deletedState(event.context.shape.businessObject);
        }
    });

    this.executed([
        'element.updateLabel'
    ], event => {
        if (is(event.context.element, 'od:Class') && event.context.element.businessObject.labelAttribute === 'name') {
            console.log(event);
            //this.mediator.renamedState(event.context.element.businessObject);
        }
    });

    this.reverted([
        'element.updateLabel'
    ], event => {
        if (is(event.context.element, 'od:Class') && event.context.element.businessObject.labelAttribute === 'name') {
            console.log(event);
            //this.mediator.renamedState(event.context.element.businessObject);
        }
    });
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
    this.goalStateModeler = goalStateModeler;
    this.mediator.goalStateModelerHook = this;
}