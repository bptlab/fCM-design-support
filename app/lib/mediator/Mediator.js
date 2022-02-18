import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import inherits from 'inherits';
import { isFunction, without } from 'min-dash';
import { is } from '../util/Util';
import OlcEvents from '../olcmodeler/OlcEvents';
import FragmentEvents from '../fragmentmodeler/FragmentEvents';
import { namespace, root } from '../util/Util';
import AbstractHook from './AbstractHook';

const DEFAULT_EVENT_PRIORITY = 1000; //From diagram-js/lib/core/EventBus.DEFAULT_PRIORITY

// Test: var a = new Mediator(); var b = new Mediator; assert new a.XYHook().mediator === a;
// a = new Mediator(); b = new Mediator(); new a.foobar().mediator === a

export default function Mediator() {
    var self = this;
    this._hooks = [];
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
    this._executed = [];
    this._on = [];

    //Propagate mouse events in order to defocus elements and close menus
    this.on(['element.mousedown', 'element.mouseup', 'element.click'], DEFAULT_EVENT_PRIORITY - 1, (event, data, hook) => {
        if (!event.handledByMediator) {
            const { originalEvent, element } = event;
            without(this.getHooks(), hook).forEach(propagateHook => {
                propagateHook.eventBus?.fire(event.type, { originalEvent, element, handledByMediator: true });
            });
        } else {
            // Do not propagate handle these events by low priority listeners such as canvas-move
            event.cancelBubble = true;
        }
    });
}

Mediator.prototype.getHooks = function () {
    return this._hooks;
}

Mediator.prototype.getModelers = function () {
    return this.getHooks().map(hook => hook.modeler);
}

Mediator.prototype.handleHookCreated = function (hook) {
    this._hooks.push(hook);

    this._executed.forEach(({events, callback}) => {
        if (hook.executed) {
            hook.executed(events, callback);
        }
    });

    this._on.forEach(({events, priority, callback}) => {
        hook.eventBus?.on(events, priority, wrapCallback(callback, hook));
    });
}

Mediator.prototype.executed = function(events, callback) {
    this._executed.push({events, callback});
    this.getHooks().forEach(hook => {
        if (hook.executed) {
            hook.executed(events, callback);
        }
    });
}

Mediator.prototype.on = function(events, priority, callback) {
    if (isFunction(priority)) {
        callback = priority;
        priority = DEFAULT_EVENT_PRIORITY;
    }
    this._on.push({events, priority, callback});
    this.getHooks().forEach(hook => {
        hook.eventBus?.on(events, priority, wrapCallback(callback, hook));
    });
}

function wrapCallback(callback, hook) {
    return (...args) => callback(...args, hook);
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
}

Mediator.prototype.confirmStateDeletion = function (olcState) {
    const affectedLiterals = this.goalStateModelerHook.modeler.getLiteralsWithState(olcState);
    const affectedDataObjectReferences = this.fragmentModelerHook.modeler.getDataObjectReferencesInState(olcState);
    return confirm('Do you really want to delete state \"' + olcState.name + '\" ?'
        + '\n' + 'It would be removed from ' + affectedLiterals.length + ' literal(s) and '+ affectedDataObjectReferences.length + ' data object reference(s).');
}

Mediator.prototype.deletedState = function (olcState) {
    this.goalStateModelerHook.modeler.handleStateDeleted(olcState);
    this.fragmentModelerHook.modeler.handleStateDeleted(olcState);
}

Mediator.prototype.renamedState = function (olcState) {
    this.goalStateModelerHook.modeler.handleStateRenamed(olcState);
    this.fragmentModelerHook.modeler.handleStateRenamed(olcState);
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
    const state = this.olcModelerHook.modeler.createState(name, olc);
    this.olcModelerHook.focusElement(state);
    return state;
}

Mediator.prototype.createDataclass = function (name) {
    const clazz = this.dataModelerHook.modeler.createDataclass(name);
    this.dataModelerHook.focusElement(clazz);
    return clazz;
}

Mediator.prototype.focusElement = function(element) {
    const hook = this.getHookForElement(element);
    const modeler = hook.modeler;
    this.focus(modeler);
    if (element !== hook.getRootObject()) {
        hook.focusElement(element);
    }
}

Mediator.prototype.getHookForElement = function(element) {
    const elementNamespace = namespace(element);
    const modelers = this.getHooks().filter(hook => hook.getNamespace() === elementNamespace);
    if (modelers.length !== 1) {
        throw new Error('Modeler for element '+element+' was not unique or present: '+modelers);
    }
    return modelers[0];
}

// === Olc Modeler Hook
Mediator.prototype.OlcModelerHook = function (eventBus, olcModeler) {
    CommandInterceptor.call(this, eventBus);
    AbstractHook.call(this, olcModeler, 'OLCs', 'https://github.com/bptlab/fCM-design-support/wiki/Object-Lifecycle-(OLC)');
    this.mediator.olcModelerHook = this;
    this.eventBus = eventBus;

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

    this.preExecute([
        'elements.delete'
    ], event => {
        event.context.elements = event.context.elements.filter(element => {
            if (is(element, 'olc:State')) {
                return this.mediator.confirmStateDeletion(element.businessObject);
            } else {
                return true;
            }
        });
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

    eventBus.on('import.parse.complete', ({context}) => {
        context.warnings.filter(({message}) => message.startsWith('unresolved reference')).forEach(({property, value, element}) => {
            if (property === 'olc:classRef') {
                const dataClass = this.mediator.dataModelerHook.modeler.get('elementRegistry').get(value).businessObject;
                if (!dataClass) { throw new Error('Could not resolve data class with id '+value); }
                element.classRef = dataClass;
            }
        });
    });

    this.locationOfElement = function(element) {
        return 'Olc ' + root(element).name;
    }
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
    AbstractHook.call(this, dataModeler, 'Data Model' ,'https://github.com/bptlab/fCM-design-support/wiki/Data-Model');
    this.mediator.dataModelerHook = this;
    this.eventBus = eventBus;

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
    AbstractHook.call(this, fragmentModeler, 'Fragments', 'https://github.com/bptlab/fCM-design-support/wiki/Fragments');
    this.mediator.fragmentModelerHook = this;
    this.eventBus = eventBus;

    eventBus.on(FragmentEvents.CREATED_STATE, event => {
        return this.mediator.createState(event.name, event.olc);
    });

    eventBus.on(FragmentEvents.CREATED_DATACLASS, event => {
        return this.mediator.createDataclass(event.name);
    });

    eventBus.on('import.parse.complete', ({warnings}) => {
        warnings.filter(({message}) => message.startsWith('unresolved reference')).forEach(({property, value, element}) => {
            if (property === 'fcm:dataclass') {
                const dataClass = this.mediator.dataModelerHook.modeler.get('elementRegistry').get(value).businessObject;
                if (!dataClass) { throw new Error('Could not resolve data class with id '+value); }
                element.dataclass = dataClass;
            } else if (property === 'fcm:states') {
                const state = this.mediator.olcModelerHook.modeler.getStateById(value)
                if (!state) { throw new Error('Could not resolve olc state with id '+value); }
                element.get('states').push(state);
            }
        });
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
    AbstractHook.call(this, goalStateModeler, 'Goal State', 'https://github.com/bptlab/fCM-design-support/wiki/Goal-State');
    this.mediator.goalStateModelerHook = this;
    this.eventBus = goalStateModeler.eventBus;

    this.getRootObject = function() {
        return this.modeler.getGoalState();
    }

    this.getNamespace = function () {
        return this.getRootObject() && namespace(this.getRootObject());
    }

    this.getGraphics = function (element) {
        const modeler = this.modeler;
        return element !== this.getRootObject() ?
            element.element
            : modeler._root.closest('.canvas');
    }
}

Mediator.prototype.GoalStateModelerHook.isHook = true;