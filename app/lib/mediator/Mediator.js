import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import inherits from 'inherits';
import { without } from 'min-dash';
import { is } from '../datamodelmodeler/util/ModelUtil';
import OlcEvents from '../olcmodeler/OlcEvents';
import FragmentEvents from '../fragmentmodeler/FragmentEvents';
import { meaningful_state_lables } from '../guidelines/olc_guidelines/olc_checking';

// Test: var a = new Mediator(); var b = new Mediator; assert new a.XYHook().mediator === a;
// a = new Mediator(); b = new Mediator(); new a.foobar().mediator === a

export default function Mediator() {
    var self = this;
    for (let propName in this) {
        let prototypeProp = this[propName];
        if (typeof prototypeProp === 'function' && prototypeProp.isHook) {
            this[propName] = function (...args) {
                if (new.target) {
                    this.mediator = self;
                    this.name = propName;
                }
                const callresult = prototypeProp.call(this, ...args);
                if (new.target) {
                    this.mediator.handleHookCreated(this);
                }
                return callresult;
            }
            this[propName].$inject = prototypeProp.$inject;
            this[propName].isHook = true;
            inherits(this[propName], prototypeProp);
        }
    }
}

Mediator.prototype.getHooks = function () {
    return [this.olcModelerHook, this.dataModelerHook, this.fragmentModelerHook, this.goalStateModelerHook];
}

Mediator.prototype.getModelers = function () {
    return this.getHooks().map(hook => hook.modeler);
}

Mediator.prototype.handleHookCreated = function (hook) {
    //Propagate mouse events in order to defocus elements and close menus
    hook.eventBus?.on(['element.mousedown', 'element.mouseup', 'element.click'], event => {
        if (!event.handledByMediator) {
            const { originalEvent, element } = event;
            without(this.getHooks(), hook).forEach(propagateHook => {
                propagateHook.eventBus?.fire(event.type, { originalEvent, element, handledByMediator: true });
            });
        }
    });
}

Mediator.prototype.addedClass = function (clazz) {
    this.olcModelerHook.modeler.addOlc(clazz);
}

Mediator.prototype.confirmClassDeletion = function (clazz) {
    const affectedLiterals = this.goalStateModelerHook.modeler.getLiteralsWithClassId(clazz.id);
    const affectedStates = this.olcModelerHook.modeler.getOlcById(clazz.id).get('Elements').filter(element => is(element, 'olc:State'));
    const affectedDataObjectReferences = this.fragmentModelerHook.modeler.getDataObjectReferencesOfClass(clazz);
    return confirm('Do you really want to delete class \"' + clazz.name + '\" ?'
        + '\n' + affectedLiterals.length + ' literal(s), ' + affectedStates.length + ' olc state(s), and '
        + affectedDataObjectReferences.length + ' data object reference(s) would be deleted as well.');
}

Mediator.prototype.deletedClass = function (clazz) {
    this.olcModelerHook.modeler.deleteOlc(clazz.id);
    this.fragmentModelerHook.modeler.handleClassDeleted(clazz);
}

Mediator.prototype.renamedClass = function (clazz) {
    this.olcModelerHook.modeler.renameOlc(clazz.name, clazz.id);
    this.fragmentModelerHook.modeler.handleClassRenamed(clazz);
}

Mediator.prototype.addedState = function (olcState) {
    var clazz = olcState.$parent;
    console.log('added state named \"', olcState.name, '\" with id \"', olcState.id, '\" to class named \"', clazz.name, '\" with id \"', clazz.id, "\"");

    // check for meaningful label?
    meaningful_state_lables(olcState);
}

Mediator.prototype.deletedState = function (olcState) {
    var clazz = olcState.$parent;
    console.log('removed state named \"', olcState.name, '\" with id \"', olcState.id, '\" from class named \"', clazz.name, '\" with id \"', clazz.id, "\"");
    this.goalStateModelerHook.modeler.handleStateDeleted(olcState);
    this.fragmentModelerHook.modeler.handleStateDeleted(olcState);
}

Mediator.prototype.renamedState = function (olcState) {
    this.goalStateModelerHook.modeler.handleStateRenamed(olcState);
    this.fragmentModelerHook.modeler.handleStateRenamed(olcState);
    // check for meaningful label?
    meaningful_state_lables(olcState);
}

Mediator.prototype.olcListChanged = function (olcs) {
    this.goalStateModelerHook.modeler.handleOlcListChanged(olcs);
    this.fragmentModelerHook.modeler.handleOlcListChanged(olcs);
}

Mediator.prototype.olcRenamed = function (olc, name) {
    this.dataModelerHook.modeler.renameClass(olc.classRef, name);
}

Mediator.prototype.olcDeletionRequested = function (olc) {
    const clazz = olc.classRef;
    if (this.confirmClassDeletion(clazz)) {
        this.dataModelerHook.modeler.deleteClass(clazz);
    }
}

Mediator.prototype.createState = function (name, olc) {
    return this.olcModelerHook.modeler.createState(name, olc);
}

Mediator.prototype.createDataclass = function (name) {
    return this.dataModelerHook.modeler.createDataclass(name);
}

// === Olc Modeler Hook
Mediator.prototype.OlcModelerHook = function (eventBus, olcModeler) {
    CommandInterceptor.call(this, eventBus);
    this.mediator.olcModelerHook = this;
    this.eventBus = eventBus;
    this.modeler = olcModeler;

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

    eventBus.on(OlcEvents.OLC_RENAME, event => {
        this.mediator.olcRenamed(event.olc, event.name);
    });

    eventBus.on(OlcEvents.OLC_DELETION_REQUESTED, event => {
        this.mediator.olcDeletionRequested(event.olc);
        return false; // Deletion should never be directly done in olc modeler, will instead propagate from data modeler
    });

    eventBus.on(OlcEvents.DATACLASS_CREATION_REQUESTED, event => {
        return this.mediator.createDataclass(event.name);
    });
}
inherits(Mediator.prototype.OlcModelerHook, CommandInterceptor);

Mediator.prototype.OlcModelerHook.$inject = [
    'eventBus',
    'olcModeler'
];

Mediator.prototype.OlcModelerHook.isHook = true;

// === Data Modeler Hook
Mediator.prototype.DataModelerHook = function (eventBus, dataModeler) {
    CommandInterceptor.call(this, eventBus);
    this.mediator.dataModelerHook = this;
    this.eventBus = eventBus;
    this.modeler = dataModeler;

    this.executed([
        'shape.create'
    ], event => {
        if (is(event.context.shape, 'od:Class')) {
            this.mediator.addedClass(event.context.shape.businessObject);
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
            this.mediator.deletedClass(event.context.shape.businessObject);
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

    this.preExecute([
        'elements.delete'
    ], event => {
        event.context.elements = event.context.elements.filter(element => {
            if (is(element, 'od:Class')) {
                return this.mediator.confirmClassDeletion(element.businessObject);
            } else {
                return true;
            }
        });
    });


    this.executed([
        'element.updateLabel'
    ], event => {
        var changedLabel = event.context.element.businessObject.labelAttribute;
        if (is(event.context.element, 'od:Class') && (changedLabel === 'name' || !changedLabel)) {
            this.mediator.renamedClass(event.context.element.businessObject);
        }
    });

    this.reverted([
        'element.updateLabel'
    ], event => {
        var changedLabel = event.context.element.businessObject.labelAttribute;
        if (is(event.context.element, 'od:Class') && (changedLabel === 'name' || !changedLabel)) {
            this.mediator.renamedClass(event.context.element.businessObject);
        }
    });
}
inherits(Mediator.prototype.DataModelerHook, CommandInterceptor);

Mediator.prototype.DataModelerHook.$inject = [
    'eventBus',
    'dataModeler'
];

Mediator.prototype.DataModelerHook.isHook = true;

// === Fragment Modeler Hook
Mediator.prototype.FragmentModelerHook = function (eventBus, fragmentModeler) {
    CommandInterceptor.call(this, eventBus);
    this.mediator.fragmentModelerHook = this;
    this.eventBus = eventBus;
    this.modeler = fragmentModeler;

    eventBus.on(FragmentEvents.CREATED_STATE, event => {
        return this.mediator.createState(event.name, event.olc);
    });

    eventBus.on(FragmentEvents.CREATED_DATACLASS, event => {
        return this.mediator.createDataclass(event.name);
    });
}
inherits(Mediator.prototype.FragmentModelerHook, CommandInterceptor);

Mediator.prototype.FragmentModelerHook.$inject = [
    'eventBus',
    'fragmentModeler'
];

Mediator.prototype.FragmentModelerHook.isHook = true;

// === Goal State Modeler Hook
Mediator.prototype.GoalStateModelerHook = function (goalStateModeler) {
    this.modeler = goalStateModeler;
    this.mediator.goalStateModelerHook = this;
}

Mediator.prototype.GoalStateModelerHook.isHook = true;