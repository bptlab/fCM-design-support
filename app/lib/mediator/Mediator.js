import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor";
import inherits from "inherits";
import { isFunction, without } from "min-dash";
import { is, namespace, root } from "../util/Util";
import AbstractHook from "./AbstractHook";
import CommonEvents from "../common/CommonEvents";
import ObjectiveEvents from "../objectivemodeler/ObjectiveEvents";
import OlcEvents from "../olcmodeler/OlcEvents";

const DEFAULT_EVENT_PRIORITY = 1000; //From diagram-js/lib/core/EventBus.DEFAULT_PRIORITY

// Test: var a = new Mediator(); var b = new Mediator; assert new a.XYHook().mediator === a;
// a = new Mediator(); b = new Mediator(); new a.foobar().mediator === a

export default function Mediator() {
  var self = this;
  this._hooks = [];
  for (let propName in this) {
    let prototypeProp = this[propName];
    if (typeof prototypeProp === "function" && prototypeProp.isHook) {
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
      };
      this[propName].$inject = prototypeProp.$inject;
      this[propName].isHook = true;
      inherits(this[propName], prototypeProp);
    }
  }
  this._executed = [];
  this._on = [];

  //Propagate mouse events in order to defocus elements and close menus
  this.on(
    ["element.mousedown", "element.mouseup", "element.click"],
    DEFAULT_EVENT_PRIORITY - 1,
    (event, data, hook) => {
      if (!event.handledByMediator) {
        const { originalEvent, element } = event;
        without(this.getHooks(), hook).forEach((propagateHook) => {
          propagateHook.eventBus?.fire(event.type, {
            originalEvent,
            element,
            handledByMediator: true,
          });
        });
      } else {
        // Do not propagate handle these events by low priority listeners such as canvas-move
        event.cancelBubble = true;
      }
    }
  );

  this.on(CommonEvents.DATACLASS_CREATION_REQUESTED, (event) => {
    return this.dataclassCreationRequested(event.name);
  });

  this.on(CommonEvents.STATE_CREATION_REQUESTED, (event) => {
    return this.createState(event.name, event.olc);
  });

  this.on(CommonEvents.ROLE_CREATION_REQUESTED, (event) => {
    return this.roleCreationRequested(event.name);
  });

  this.on(CommonEvents.UNIT_CREATION_REQUESTED, (event) => {
    return this.unitCreationRequested(event.name);
  });

  this.on(CommonEvents.ORGRESOURCE_CREATION_REQUESTED, (event) => {
    return this.orgResourceCreationRequested(event.name);
  });
}

Mediator.prototype.getHooks = function () {
  return this._hooks;
};

Mediator.prototype.getModelers = function () {
  return this.getHooks().map((hook) => hook.modeler);
};

Mediator.prototype.handleHookCreated = function (hook) {
  this._hooks.push(hook);

  this._executed.forEach(({ events, callback }) => {
    if (hook.executed) {
      hook.executed(events, callback);
    }
  });

  this._on.forEach(({ events, priority, callback }) => {
    hook.eventBus?.on(events, priority, wrapCallback(callback, hook));
  });
};

Mediator.prototype.executed = function (events, callback) {
  this._executed.push({ events, callback });
  this.getHooks().forEach((hook) => {
    if (hook.executed) {
      hook.executed(events, callback);
    }
  });
};

Mediator.prototype.on = function (events, priority, callback) {
  if (isFunction(priority)) {
    callback = priority;
    priority = DEFAULT_EVENT_PRIORITY;
  }
  this._on.push({ events, priority, callback });
  this.getHooks().forEach((hook) => {
    hook.eventBus?.on(events, priority, wrapCallback(callback, hook));
  });
};

Mediator.prototype.focusElement = function (element) {
  const hook = this.getHookForElement(element);
  const modeler = hook.modeler;
  this.focus(modeler);
  if (element !== hook.getRootObject()) {
    hook.focusElement(element);
  }
};

Mediator.prototype.getHookForElement = function (element) {
  const elementNamespace = namespace(element);
  const modelers = this.getHooks().filter(
    (hook) => hook.getNamespace() === elementNamespace
  );
  if (modelers.length !== 1) {
    throw new Error(
      "Modeler for element " +
        element +
        " was not unique or present: " +
        modelers
    );
  }
  return modelers[0];
};

function wrapCallback(callback, hook) {
  return (...args) => callback(...args, hook);
}

// === Data model helpers

Mediator.prototype.dataclassCreationRequested = function (name) {
  const clazz = this.dataModelerHook.modeler.createDataclass(name);
  this.dataModelerHook.focusElement(clazz);
  return clazz;
};

Mediator.prototype.addedClass = function (clazz) {
  this.olcModelerHook.modeler.addOlc(clazz);
};

Mediator.prototype.confirmClassDeletion = function (clazz) {
  const affectedLiterals =
    this.terminationConditionModelerHook.modeler.getLiteralsWithClassId(
      clazz.id
    );
  const affectedStates = this.olcModelerHook.modeler
    .getOlcByClass(clazz)
    .get("Elements")
    .filter((element) => is(element, "olc:State"));
  const affectedDataObjectReferences =
    this.fragmentModelerHook.modeler.getDataObjectReferencesOfClass(clazz);
  const affectedObjects =
    this.objectiveModelerHook.modeler.getObjectsOfClass(clazz);
  return confirm(
    'Do you really want to delete class "' +
      clazz.name +
      '" ?' +
      "\n" +
      affectedLiterals.length +
      " literal(s), " +
      affectedStates.length +
      " olc state(s), and " +
      affectedDataObjectReferences.length +
      " data object reference(s), and " +
      affectedObjects.length +
      " object(s) would be deleted as well."
  );
};

Mediator.prototype.deletedClass = function (clazz) {
  this.olcModelerHook.modeler.deleteOlc(clazz);
  this.fragmentModelerHook.modeler.handleClassDeleted(clazz);
  this.objectiveModelerHook.modeler.handleClassDeleted(clazz);
};

Mediator.prototype.renamedClass = function (clazz) {
  this.olcModelerHook.modeler.renameOlc(clazz.name, clazz);
  this.fragmentModelerHook.modeler.handleClassRenamed(clazz);
  this.objectiveModelerHook.modeler.handleClassRenamed(clazz);
};

// === Dependency model helpers

Mediator.prototype.addedObjective = function (objective) {
  this.objectiveModelerHook.modeler.addObjective(objective);
};

Mediator.prototype.confirmObjectiveDeletion = function (objective) {
  return confirm(
    'Do you really want to delete objective "' +
      objective.businessObject.name +
      '" ?'
  );
};

Mediator.prototype.deletedObjective = function (objective) {
  this.objectiveModelerHook.modeler.deleteObjective(objective);
};

Mediator.prototype.renamedObjective = function (objective, objectiveName) {
  this.objectiveModelerHook.modeler.renameObjective(objective, objectiveName);
};

// === Objective model helpers

Mediator.prototype.objectiveCreationRequested = function (name) {
  return this.dependencyModelerHook.modeler.createObjective(name);
};

Mediator.prototype.objectiveDeletionRequested = function (objective) {
  const objectiveRef = objective.objectiveRef;
  this.dependencyModelerHook.modeler.deleteObjective(objectiveRef);
};

Mediator.prototype.objectiveRenamingRequested = function (
  objective,
  objectiveName
) {
  this.dependencyModelerHook.modeler.renameObjective(objective, objectiveName);
};

Mediator.prototype.createInstance = function (name, clazz) {
  const instance = this.objectiveModelerHook.modeler.createInstance(
    name,
    clazz
  );
  return instance;
};

// === OLC helpers

Mediator.prototype.olcListChanged = function (olcs) {
  this.terminationConditionModelerHook.modeler.handleOlcListChanged(olcs);
  this.fragmentModelerHook.modeler.handleOlcListChanged(olcs);
  this.objectiveModelerHook.modeler.handleOlcListChanged(olcs);
};

Mediator.prototype.olcDeletionRequested = function (olc) {
  const clazz = olc.classRef;
  if (this.confirmClassDeletion(clazz)) {
    this.dataModelerHook.modeler.deleteClass(clazz);
  }
};

Mediator.prototype.olcRenamed = function (olc, name) {
  this.dataModelerHook.modeler.renameClass(olc.classRef, name);
};

// === Role helpers

Mediator.prototype.roleListChanged = function () {
  let roles = this.roleModelerHook.modeler.getRoles();
  this.fragmentModelerHook.modeler.handleRoleListChanged(roles);
  this.resourceModelerHook.modeler.handleRoleListChanged(roles);
};

Mediator.prototype.unitListChanged = function () {
  let units = this.roleModelerHook.modeler.getUnits();
  this.fragmentModelerHook.modeler.handleUnitListChanged(units);
  // this.resourceModelerHook.modeler.handleUnitListChanged(units);
};

Mediator.prototype.orgResourceListChanged = function () {
  let orgResources = this.roleModelerHook.modeler.getOrgResources();
  this.fragmentModelerHook.modeler.handleOrgResourceListChanged(orgResources);
  // this.resourceModelerHook.modeler.handleUnitListChanged(units);
};

Mediator.prototype.roleCreationRequested = function (name) {
  const role = this.roleModelerHook.modeler.createRole(name);
  this.roleModelerHook.focusElement(role);
  return role;
};

Mediator.prototype.unitCreationRequested = function (name) {
  const unit = this.roleModelerHook.modeler.createUnit(name);
  this.roleModelerHook.focusElement(unit);
  return unit;
};

Mediator.prototype.orgResourceCreationRequested = function (name) {
  const orgResource = this.roleModelerHook.modeler.createOrgResource(name);
  this.roleModelerHook.focusElement(orgResource);
  return orgResource;
};

Mediator.prototype.addedRole = function () {
  this.roleListChanged();
};

Mediator.prototype.addedUnit = function () {
  this.unitListChanged();
};

Mediator.prototype.addedOrgResource = function () {
  this.orgResourceListChanged();
};

Mediator.prototype.confirmRoleDeletion = function (role) {
  const affectedTasks = this.fragmentModelerHook.modeler.getTasksWithRole(role);
  const affectedResources =
    this.resourceModelerHook.modeler.getResourcesWithRole(role);
  return confirm("Deleting this Position/Role might affect your BPMN Model");
};

Mediator.prototype.deletedRole = function (role) {
  this.fragmentModelerHook.modeler.handleRoleDeleted(role);
  this.resourceModelerHook.modeler.handleRoleDeleted(role);
  this.roleListChanged();
};

Mediator.prototype.renamedRole = function (role) {
  this.fragmentModelerHook.modeler.handleRoleRenamed(role);
  this.resourceModelerHook.modeler.handleRoleRenamed(role);
};

Mediator.prototype.confirmUnitDeletion = function (unit) {
  const affectedTasks = this.fragmentModelerHook.modeler.getTasksWithUnit(unit);
  // const affectedResources =
  //   this.resourceModelerHook.modeler.getResourcesWithRole(unit);
  return confirm(
    "Deleting this Organizational Unit might affect your BPMN Model"
  );
};

Mediator.prototype.deletedUnit = function (unit) {
  this.fragmentModelerHook.modeler.handleUnitDeleted(unit);
  // this.resourceModelerHook.modeler.handleUnitDeleted(unit);
  this.unitListChanged();
};

Mediator.prototype.renamedUnit = function (unit) {
  this.fragmentModelerHook.modeler.handleUnitRenamed(unit);
  // this.resourceModelerHook.modeler.handleRoleRenamed(unit);
};

Mediator.prototype.confirmOrgResourceDeletion = function (orgResource) {
  const affectedTasks =
    this.fragmentModelerHook.modeler.getTasksWithOrgResource(orgResource);
  // const affectedResources =
  //   this.resourceModelerHook.modeler.getResourcesWithRole(unit);
  return confirm("Deleting this Resource might affect your BPMN Model");
};

Mediator.prototype.deletedOrgResource = function (orgResource) {
  this.fragmentModelerHook.modeler.handleOrgResourceDeleted(orgResource);
  // this.resourceModelerHook.modeler.handleUnitDeleted(unit);
  this.orgResourceListChanged();
};

Mediator.prototype.renamedOrgResource = function (orgResource) {
  this.fragmentModelerHook.modeler.handleOrgResourceRenamed(orgResource);
  // this.resourceModelerHook.modeler.handleRoleRenamed(unit);
};

// === State helpers (used within OLC Modeler)

Mediator.prototype.createState = function (name, olc) {
  const state = this.olcModelerHook.modeler.createState(name, olc);
  this.olcModelerHook.focusElement(state);
  return state;
};

Mediator.prototype.confirmStateDeletion = function (olcState) {
  const affectedLiterals =
    this.terminationConditionModelerHook.modeler.getLiteralsWithState(olcState);
  const affectedDataObjectReferences =
    this.fragmentModelerHook.modeler.getDataObjectReferencesInState(olcState);
  const affectedObjects =
    this.objectiveModelerHook.modeler.getObjectsInState(olcState);
  return confirm(
    'Do you really want to delete state "' +
      olcState.name +
      '" ?' +
      "\n" +
      "It would be removed from " +
      affectedLiterals.length +
      " literal(s) and " +
      affectedDataObjectReferences.length +
      " data object reference(s) and " +
      affectedObjects.length +
      " object(s)."
  );
};

Mediator.prototype.deletedState = function (olcState) {
  this.terminationConditionModelerHook.modeler.handleStateDeleted(olcState);
  this.fragmentModelerHook.modeler.handleStateDeleted(olcState);
  this.objectiveModelerHook.modeler.handleStateDeleted(olcState);
};

Mediator.prototype.renamedState = function (olcState) {
  this.terminationConditionModelerHook.modeler.handleStateRenamed(olcState);
  this.fragmentModelerHook.modeler.handleStateRenamed(olcState);
  this.objectiveModelerHook.modeler.handleStateRenamed(olcState);
};

// === Data Modeler Hook
Mediator.prototype.DataModelerHook = function (eventBus, dataModeler) {
  CommandInterceptor.call(this, eventBus);
  AbstractHook.call(
    this,
    dataModeler,
    "Data Model",
    "https://github.com/Noel-Bastubbe/for-Construction-Modeling/wiki/Data-Modeler"
  );
  this.mediator.dataModelerHook = this;
  this.eventBus = eventBus;

  this.executed(["shape.create"], (event) => {
    if (is(event.context.shape, "od:Class")) {
      this.mediator.addedClass(event.context.shape.businessObject);
    }
  });

  this.reverted(["shape.create"], (event) => {
    if (is(event.context.shape, "od:Class")) {
      console.log(event);
      //this.mediator.addedState(event.context.shape.businessObject);
    }
  });

  this.executed(["shape.delete"], (event) => {
    if (is(event.context.shape, "od:Class")) {
      this.mediator.deletedClass(event.context.shape.businessObject);
    }
  });

  this.reverted(["shape.delete"], (event) => {
    if (is(event.context.shape, "od:Class")) {
      console.log(event);
      //this.mediator.deletedState(event.context.shape.businessObject);
    }
  });

  this.preExecute(["elements.delete"], (event) => {
    event.context.elements = event.context.elements.filter((element) => {
      if (is(element, "od:Class")) {
        return this.mediator.confirmClassDeletion(element.businessObject);
      } else {
        return true;
      }
    });
  });

  this.executed(["element.updateLabel"], (event) => {
    var changedLabel = event.context.element.businessObject.labelAttribute;
    if (
      is(event.context.element, "od:Class") &&
      (changedLabel === "name" || !changedLabel)
    ) {
      this.mediator.renamedClass(event.context.element.businessObject);
    }
  });

  this.reverted(["element.updateLabel"], (event) => {
    var changedLabel = event.context.element.businessObject.labelAttribute;
    if (
      is(event.context.element, "od:Class") &&
      (changedLabel === "name" || !changedLabel)
    ) {
      this.mediator.renamedClass(event.context.element.businessObject);
    }
  });
};
inherits(Mediator.prototype.DataModelerHook, CommandInterceptor);

Mediator.prototype.DataModelerHook.$inject = ["eventBus", "dataModeler"];

Mediator.prototype.DataModelerHook.isHook = true;

// === Dependency Modeler Hook
Mediator.prototype.DependencyModelerHook = function (
  eventBus,
  dependencyModeler
) {
  CommandInterceptor.call(this, eventBus);
  AbstractHook.call(
    this,
    dependencyModeler,
    "Dependency Model",
    "https://github.com/Noel-Bastubbe/for-Construction-Modeling/wiki/Dependency-Modeler"
  );
  this.mediator.dependencyModelerHook = this;
  this.eventBus = eventBus;

  this.executed(["shape.create"], (event) => {
    if (is(event.context.shape, "dep:Objective")) {
      this.mediator.addedObjective(event.context.shape.businessObject);
    }
  });
  this.executed(["shape.delete"], (event) => {
    if (is(event.context.shape, "dep:Objective")) {
      this.mediator.deletedObjective(event.context.shape.businessObject);
    }
  });

  this.preExecute(["elements.delete"], (event) => {
    event.context.elements = event.context.elements.filter((element) => {
      if (is(element, "dep:Objective")) {
        return this.mediator.confirmObjectiveDeletion(element);
      } else {
        return true;
      }
    });
  });

  this.executed(["element.updateLabel"], (event) => {
    if (is(event.context.element, "dep:Objective")) {
      const objective = event.context.element.businessObject;
      this.mediator.renamedObjective(objective, objective.name);
    }
  });

  this.reverted(["element.updateLabel"], (event) => {
    if (is(event.context.element, "dep:Objective")) {
      const objective = event.context.element.businessObject;
      this.mediator.renamedObjective(objective, objective.name);
    }
  });

  eventBus.on(ObjectiveEvents.OBJECTIVE_RENAMED, (event) => {
    const objective = event.objective.businessObject;
    this.mediator.renamedObjective(objective, objective.name);
  });
};
inherits(Mediator.prototype.DependencyModelerHook, CommandInterceptor);

Mediator.prototype.DependencyModelerHook.$inject = [
  "eventBus",
  "dependencyModeler",
];

Mediator.prototype.DependencyModelerHook.isHook = true;

// === Fragment Modeler Hook
Mediator.prototype.FragmentModelerHook = function (eventBus, fragmentModeler) {
  CommandInterceptor.call(this, eventBus);
  AbstractHook.call(
    this,
    fragmentModeler,
    "Fragments",
    "https://github.com/Noel-Bastubbe/for-Construction-Modeling/wiki/Fragment-Modeler"
  );
  this.mediator.fragmentModelerHook = this;
  this.eventBus = eventBus;

  eventBus.on("import.parse.complete", ({ warnings }) => {
    warnings
      .filter(({ message }) => message.startsWith("unresolved reference"))
      .forEach(({ property, value, element }) => {
        if (property === "fcm:dataclass") {
          const dataClass = this.mediator.dataModelerHook.modeler
            .get("elementRegistry")
            .get(value).businessObject;
          if (!dataClass) {
            throw new Error("Could not resolve data class with id " + value);
          }
          element.dataclass = dataClass;
        } else if (property === "fcm:states") {
          const state =
            this.mediator.olcModelerHook.modeler.getStateById(value);
          if (!state) {
            throw new Error("Could not resolve olc state with id " + value);
          }
          element.get("states").push(state);
        } else if (property === "fcm:role") {
          const role = this.mediator.roleModelerHook.modeler
            .get("elementRegistry")
            .get(value).businessObject;
          if (!role) {
            throw new Error("Could not resolve role with id " + value);
          }
          element.role = role;
        }
      });
  });
};
inherits(Mediator.prototype.FragmentModelerHook, CommandInterceptor);

Mediator.prototype.FragmentModelerHook.$inject = [
  "eventBus",
  "fragmentModeler",
];

Mediator.prototype.FragmentModelerHook.isHook = true;

// === Objective Modeler Hook
Mediator.prototype.ObjectiveModelerHook = function (
  eventBus,
  objectiveModeler
) {
  CommandInterceptor.call(this, eventBus);
  AbstractHook.call(
    this,
    objectiveModeler,
    "Objective Model",
    "https://github.com/Noel-Bastubbe/for-Construction-Modeling/wiki/Objective-Modeler"
  );
  this.mediator.objectiveModelerHook = this;
  this.eventBus = eventBus;

  this.executed(["shape.create"], (event) => {
    if (is(event.context.shape, "om:Object")) {
      //this.mediator.addedClass(event.context.shape.businessObject);
    }
  });

  this.reverted(["shape.create"], (event) => {
    if (is(event.context.shape, "om:Object")) {
      console.log(event);
      //this.mediator.addedState(event.context.shape.businessObject);
    }
  });

  this.executed(["shape.delete"], (event) => {
    if (is(event.context.shape, "om:Object")) {
      //this.mediator.deletedClass(event.context.shape.businessObject);
    }
  });

  this.reverted(["shape.delete"], (event) => {
    if (is(event.context.shape, "om:Object")) {
      console.log(event);
      //this.mediator.deletedState(event.context.shape.businessObject);
    }
  });

  this.preExecute(["elements.delete"], (event) => {
    event.context.elements = event.context.elements.filter((element) => {
      if (is(element, "om:Object")) {
        return this.modeler.deleteObject(element);
      } else {
        return true;
      }
    });
  });

  this.executed(["element.updateLabel"], (event) => {
    var changedLabel = event.context.element.businessObject.labelAttribute;
    if (
      is(event.context.element, "om:Object") &&
      (changedLabel === "name" || !changedLabel)
    ) {
      //this.mediator.renamedClass(event.context.element.businessObject);
    }
  });

  this.reverted(["element.updateLabel"], (event) => {
    var changedLabel = event.context.element.businessObject.labelAttribute;
    if (
      is(event.context.element, "om:Object") &&
      (changedLabel === "name" || !changedLabel)
    ) {
      //this.mediator.renamedClass(event.context.element.businessObject);
    }
  });

  eventBus.on("import.parse.complete", ({ context }) => {
    context.warnings
      .filter(({ message }) => message.startsWith("unresolved reference"))
      .forEach(({ property, value, element }) => {
        if (property === "om:classRef") {
          const dataClass = this.mediator.dataModelerHook.modeler
            .get("elementRegistry")
            .get(value).businessObject;
          if (!dataClass) {
            throw new Error("Could not resolve data class with id " + value);
          }
          element.classRef = dataClass;
        }
        if (property === "om:states") {
          const state =
            this.mediator.olcModelerHook.modeler.getStateById(value);
          if (!state) {
            throw new Error("Could not resolve state with id " + value);
          }
          if (element.states) {
            element.states.push(state);
          } else {
            element.states = [state];
          }
        }
        if (property === "odDi:objectiveRef") {
          const objective = this.mediator.dependencyModelerHook.modeler
            .get("elementRegistry")
            .get(value).businessObject;
          if (!objective) {
            throw new Error("Could not resolve objectives with id " + value);
          }
          element.objectiveRef = objective;
        }
      });
  });

  eventBus.on(ObjectiveEvents.OBJECTIVE_CREATION_REQUESTED, (event) => {
    return this.mediator.objectiveCreationRequested(event.name);
  });

  eventBus.on(ObjectiveEvents.OBJECTIVE_DELETION_REQUESTED, (event) => {
    this.mediator.objectiveDeletionRequested(event.objective);
    return false; // Deletion should never be directly done in objective modeler, will instead propagate from dependency modeler
  });

  eventBus.on(ObjectiveEvents.OBJECTIVE_RENAMING_REQUESTED, (event) => {
    this.mediator.objectiveRenamingRequested(event.objective, event.name);
  });
};
inherits(Mediator.prototype.ObjectiveModelerHook, CommandInterceptor);

Mediator.prototype.ObjectiveModelerHook.$inject = [
  "eventBus",
  "objectiveModeler",
];

Mediator.prototype.ObjectiveModelerHook.isHook = true;

// === Olc Modeler Hook
Mediator.prototype.OlcModelerHook = function (eventBus, olcModeler) {
  CommandInterceptor.call(this, eventBus);
  AbstractHook.call(
    this,
    olcModeler,
    "OLCs",
    "https://github.com/bptlab/fCM-design-support/wiki/Object-Lifecycle-%28OLC%29"
  );
  this.mediator.olcModelerHook = this;
  this.eventBus = eventBus;

  this.executed(["shape.create"], (event) => {
    if (is(event.context.shape, "olc:State")) {
      // this.mediator.addedState(event.context.shape.businessObject);
    }
  });
  this.executed(["shape.delete"], (event) => {
    if (is(event.context.shape, "olc:State")) {
      this.mediator.deletedState(event.context.shape.businessObject);
    }
  });

  this.preExecute(["elements.delete"], (event) => {
    event.context.elements = event.context.elements.filter((element) => {
      if (is(element, "olc:State")) {
        return this.mediator.confirmStateDeletion(element.businessObject);
      } else {
        return true;
      }
    });
  });

  this.executed(["element.updateLabel"], (event) => {
    if (is(event.context.element, "olc:State")) {
      this.mediator.renamedState(event.context.element.businessObject);
    }
  });

  this.reverted(["element.updateLabel"], (event) => {
    if (is(event.context.element, "olc:State")) {
      this.mediator.renamedState(event.context.element.businessObject);
    }
  });

  eventBus.on(OlcEvents.DEFINITIONS_CHANGED, (event) => {
    this.mediator.olcListChanged(event.definitions.olcs);
  });

  eventBus.on(OlcEvents.OLC_RENAME, (event) => {
    this.mediator.olcRenamed(event.olc, event.name);
  });

  eventBus.on(OlcEvents.OLC_DELETION_REQUESTED, (event) => {
    this.mediator.olcDeletionRequested(event.olc);
    return false; // Deletion should never be directly done in olc modeler, will instead propagate from data modeler
  });

  eventBus.on("import.parse.complete", ({ context }) => {
    context.warnings
      .filter(({ message }) => message.startsWith("unresolved reference"))
      .forEach(({ property, value, element }) => {
        if (property === "olc:classRef") {
          const dataClass = this.mediator.dataModelerHook.modeler
            .get("elementRegistry")
            .get(value).businessObject;
          if (!dataClass) {
            throw new Error("Could not resolve data class with id " + value);
          }
          element.classRef = dataClass;
        }
      });
  });

  this.locationOfElement = function (element) {
    return "Olc " + root(element).name;
  };
};
inherits(Mediator.prototype.OlcModelerHook, CommandInterceptor);

Mediator.prototype.OlcModelerHook.$inject = ["eventBus", "olcModeler"];

Mediator.prototype.OlcModelerHook.isHook = true;

// === Resource Modeler Hook
Mediator.prototype.ResourceModelerHook = function (eventBus, resourceModeler) {
  CommandInterceptor.call(this, eventBus);
  AbstractHook.call(
    this,
    resourceModeler,
    "Resource Model",
    "https://github.com/Noel-Bastubbe/for-Construction-Modeling/wiki/Resource-Modeler"
  );
  this.mediator.resourceModelerHook = this;
  this.eventBus = eventBus;

  this.executed(["shape.create"], (event) => {
    if (is(event.context.shape, "rem:Position")) {
      //this.mediator.addedClass(event.context.shape.businessObject);
    }
  });

  this.reverted(["shape.create"], (event) => {
    if (is(event.context.shape, "rem:Position")) {
      console.log(event);
      //this.mediator.addedState(event.context.shape.businessObject);
    }
  });

  this.executed(["shape.delete"], (event) => {
    if (is(event.context.shape, "rem:Position")) {
      //this.mediator.deletedClass(event.context.shape.businessObject);
    }
  });

  this.reverted(["shape.delete"], (event) => {
    if (is(event.context.shape, "rem:Position")) {
      console.log(event);
      //this.mediator.deletedState(event.context.shape.businessObject);
    }
  });

  this.preExecute(["elements.delete"], (event) => {
    event.context.elements = event.context.elements.filter((element) => {
      if (is(element, "rem:Position")) {
        return this.modeler.deleteResource(element);
      } else {
        return true;
      }
    });
  });

  this.executed(["element.updateLabel"], (event) => {
    // var changedLabel = event.context.element.businessObject.labelAttribute;
    // if (
    //   is(event.context.element, "rem:Position") &&
    //   (changedLabel === "name" || !changedLabel)
    // ) {
    //   //this.mediator.renamedClass(event.context.element.businessObject);
    // }
  });

  this.reverted(["element.updateLabel"], (event) => {
    // var changedLabel = event.context.element.businessObject.labelAttribute;
    // if (
    //   is(event.context.element, "rem:Position") &&
    //   (changedLabel === "name" || !changedLabel)
    // ) {
    //   //this.mediator.renamedClass(event.context.element.businessObject);
    // }
  });

  eventBus.on("import.parse.complete", ({ context }) => {
    context.warnings
      .filter(({ message }) => message.startsWith("unresolved reference"))
      .forEach(({ property, value, element }) => {
        if (property === "rem:roles") {
          const role = this.mediator.roleModelerHook.modeler
            .get("elementRegistry")
            .get(value).businessObject;
          if (!role) {
            throw new Error("Could not resolve role with id " + value);
          }
          if (element.roles) {
            element.roles.push(role);
          } else {
            element.roles = [role];
          }
        }
      });
  });
};
inherits(Mediator.prototype.ResourceModelerHook, CommandInterceptor);

Mediator.prototype.ResourceModelerHook.$inject = [
  "eventBus",
  "resourceModeler",
];

Mediator.prototype.ResourceModelerHook.isHook = true;

// === Role Modeler Hook
Mediator.prototype.RoleModelerHook = function (eventBus, roleModeler) {
  CommandInterceptor.call(this, eventBus);
  AbstractHook.call(
    this,
    roleModeler,
    "Role Model",
    "https://github.com/Noel-Bastubbe/for-Construction-Modeling/wiki/Role-Modeler"
  );
  this.mediator.roleModelerHook = this;
  this.eventBus = eventBus;

  this.executed(["shape.create"], (event) => {
    if (is(event.context.shape, ["rom:Position"])) {
      this.mediator.addedRole(event.context.shape.businessObject);
    } else if (is(event.context.shape, ["rom:OrganizationalUnit"])) {
      this.mediator.addedUnit(event.context.shape.businessObject);
    } else if (is(event.context.shape, ["rom:OrgResource"])) {
      this.mediator.addedOrgResource(event.context.shape.businessObject);
    }
  });

  this.reverted(["shape.create"], (event) => {
    if (is(event.context.shape, ["rom:Position"])) {
      // console.log(event);
    } else if (is(event.context.shape, ["rom:OrganizationalUnit"])) {
      // Handle reverted event for organizational unit creation if needed
    } else if (is(event.context.shape, ["rom:OrgResource"])) {
      // Handle reverted event for organizational unit creation if needed
    }
  });

  this.executed(["shape.delete"], (event) => {
    if (is(event.context.shape, ["rom:Position"])) {
      this.mediator.deletedRole(event.context.shape.businessObject);
    } else if (is(event.context.shape, ["rom:OrganizationalUnit"])) {
      this.mediator.deletedUnit(event.context.shape.businessObject);
    } else if (is(event.context.shape, ["rom:OrgResource"])) {
      this.mediator.deletedOrgResource(event.context.shape.businessObject);
    }
  });

  this.reverted(["shape.delete"], (event) => {
    if (is(event.context.shape, ["rom:Position"])) {
      // console.log(event);
      //this.mediator.deletedState(event.context.shape.businessObject);
    } else if (is(event.context.shape, ["rom:OrganizationalUnit"])) {
      // Handle reverted event for organizational unit deletion if needed
    } else if (is(event.context.shape, ["rom:OrgResource"])) {
      // Handle reverted event for organizational unit deletion if needed
    }
  });

  this.preExecute(["elements.delete"], (event) => {
    event.context.elements = event.context.elements.filter((element) => {
      if (is(element, ["rom:Position"])) {
        return this.mediator.confirmRoleDeletion(element.businessObject);
      } else if (is(element, ["rom:OrganizationalUnit"])) {
        return this.mediator.confirmUnitDeletion(element.businessObject);
      } else if (is(element, ["rom:OrgResource"])) {
        return this.mediator.confirmOrgResourceDeletion(element.businessObject);
      } else {
        return true;
      }
    });
  });

  this.executed(["element.updateLabel"], (event) => {
    this.mediator.renamedRole(event.context.element);
  });

  this.reverted(["element.updateLabel"], (event) => {});

  eventBus.on("import.render.complete", (event) => {
    this.mediator.roleListChanged(this.modeler.getRoles());
  });

  // //units
  // this.executed(["shape.create"], (event) => {
  //   if (is(event.context.shape, ["rom:OrganizationalUnit"])) {
  //     this.mediator.addedUnit(event.context.shape.businessObject);
  //   }
  // });

  // this.reverted(["shape.create"], (event) => {
  //   if (is(event.context.shape, ["rom:OrganizationalUnit"])) {
  //     // console.log(event);
  //   }
  // });

  // this.executed(["shape.delete"], (event) => {
  //   if (is(event.context.shape, ["rom:OrganizationalUnit"])) {
  //     this.mediator.deletedUnit(event.context.shape.businessObject);
  //   }
  // });

  // this.reverted(["shape.delete"], (event) => {
  //   if (is(event.context.shape, ["rom:OrganizationalUnit"])) {
  //     // console.log(event);
  //     //this.mediator.deletedState(event.context.shape.businessObject);
  //   }
  // });

  // this.preExecute(["elements.delete"], (event) => {
  //   event.context.elements = event.context.elements.filter((element) => {
  //     if (is(element, ["rom:OrganizationalUnit"])) {
  //       return this.mediator.confirmUnitDeletion(element.businessObject);
  //     } else {
  //       return true;
  //     }
  //   });
  // });

  this.executed(["element.updateLabel"], (event) => {
    this.mediator.renamedUnit(event.context.element);
  });

  this.reverted(["element.updateLabel"], (event) => {});

  eventBus.on("import.render.complete", (event) => {
    this.mediator.unitListChanged(this.modeler.getUnits());
  });

  this.executed(["element.updateLabel"], (event) => {
    this.mediator.renamedOrgResource(event.context.element);
  });

  this.reverted(["element.updateLabel"], (event) => {});

  eventBus.on("import.render.complete", (event) => {
    this.mediator.orgResourceListChanged(this.modeler.getOrgResources());
  });
};
inherits(Mediator.prototype.RoleModelerHook, CommandInterceptor);

Mediator.prototype.RoleModelerHook.$inject = ["eventBus", "roleModeler"];

Mediator.prototype.RoleModelerHook.isHook = true;

// ===  Termination Condition Modeler Hook
Mediator.prototype.TerminationConditionModelerHook = function (
  terminationConditionModeler
) {
  AbstractHook.call(
    this,
    terminationConditionModeler,
    "Termination Condition",
    "https://github.com/bptlab/fCM-design-support/wiki/Goal-State"
  );
  this.mediator.terminationConditionModelerHook = this;
  this.eventBus = terminationConditionModeler.eventBus;

  this.getRootObject = function () {
    return this.modeler.getTerminationCondition();
  };

  this.getNamespace = function () {
    return this.getRootObject() && namespace(this.getRootObject());
  };

  this.getGraphics = function (element) {
    const modeler = this.modeler;
    return element !== this.getRootObject()
      ? modeler.getStatements().includes(element) && element.element
      : modeler._root.closest(".canvas");
  };

  this.eventBus.on("import.parse.complete", ({ warnings }) => {
    warnings
      .filter(({ message }) => message.startsWith("unresolved reference"))
      .forEach(({ property, value, element }) => {
        if (property === "tc:class") {
          const olcClass =
            this.mediator.olcModelerHook.modeler.getOlcById(value);
          if (!olcClass) {
            throw new Error("Could not resolve data class with id " + value);
          }
          element.class = olcClass;
        } else if (property === "tc:states") {
          const state =
            this.mediator.olcModelerHook.modeler.getStateById(value);
          if (!state) {
            throw new Error("Could not resolve olc state with id " + value);
          }
          element.get("states").push(state);
        }
      });
  });
};

Mediator.prototype.TerminationConditionModelerHook.isHook = true;
