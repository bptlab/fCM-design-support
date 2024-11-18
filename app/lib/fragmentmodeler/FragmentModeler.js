import inherits from "inherits";
import BpmnModeler from "bpmn-js/lib/Modeler";
import fragmentPaletteModule from "./palette";
import customModelingModule from "./modeling";
import bpmnExtension from "./moddle/bpmnextension.json";
import { is } from "bpmn-js/lib/util/ModelUtil";
import { without } from "min-dash";
import laneLabelHandling from "./laneLabelHandling";
import activityLabelHandling from "./activityLabelHandling";
import taskRenderer from "./draw";
import poolRenderer from "./renderPool";
import laneRenderer from "./renderLane";

export default function FragmentModeler(options) {
  const customModules = [
    fragmentPaletteModule,
    customModelingModule,
    taskRenderer,
    poolRenderer,
    laneRenderer,
    laneLabelHandling,
    activityLabelHandling,
    {
      fragmentModeler: ["value", this],
    },
  ];

  options.additionalModules = [
    ...customModules,
    ...(options.additionalModules || []),
  ];

  options.moddleExtensions = {
    fcm: bpmnExtension,
  };

  BpmnModeler.call(this, options);

  //Explicitely allow the copying of references (to objects outside the fragment modeler)
  // See https://github.com/bpmn-io/bpmn-js/blob/212af3bb51840465e5809345ea3bb3da86656be3/lib/features/copy-paste/ModdleCopy.js#L218
  this.get("eventBus").on("moddleCopy.canCopyProperty", function (context) {
    if (
      context.propertyName === "dataclass" ||
      context.propertyName === "states" ||
      context.propertyName === "role"
    ) {
      if (context.propertyName != null && context.propertyName === "states") {
        return context.property.slice();
      }
      return context.property;
    }
  });
}
inherits(FragmentModeler, BpmnModeler);

FragmentModeler.prototype.id = "FM";
FragmentModeler.prototype.rank = 1;

FragmentModeler.prototype.name = function (constructionMode) {
  if (constructionMode) {
    return "BPMN Modeler";
  } else {
    return "BPMN Modeler";
  }
};

FragmentModeler.prototype.handleOlcListChanged = function (
  olcs,
  dryRun = false
) {
  this._olcs = olcs;
};

FragmentModeler.prototype.handleRoleListChanged = function (
  roles,
  dryRun = false
) {
  this._roles = roles;
};

FragmentModeler.prototype.handleRoleRenamed = function (role) {
  this.getTasksWithRole(role).forEach((element) =>
    this.get("eventBus").fire("element.changed", {
      element,
    })
  );
};

FragmentModeler.prototype.handleRoleDeleted = function (role) {
  this.getTasksWithRole(role).forEach((element, gfx) => {
    element.businessObject.role = undefined;
    this.get("eventBus").fire("element.changed", {
      element,
    });
  });
};

FragmentModeler.prototype.handleUnitListChanged = function (
  units,
  dryRun = false
) {
  this._units = units;
};

FragmentModeler.prototype.handleUnitRenamed = function (unit) {
  this.getTasksWithUnit(unit).forEach((element) =>
    this.get("eventBus").fire("element.changed", {
      element,
    })
  );
};

FragmentModeler.prototype.handleUnitDeleted = function (unit) {
  this.getTasksWithUnit(unit).forEach((element, gfx) => {
    element.businessObject.unit = undefined;
    this.get("eventBus").fire("element.changed", {
      element,
    });
  });
};

FragmentModeler.prototype.handleOrgResourceListChanged = function (
  orgResources,
  dryRun = false
) {
  this._orgResources = orgResources;
};

FragmentModeler.prototype.handleOrgResourceRenamed = function (orgResource) {
  this.getTasksWithOrgResource(orgResource).forEach((element) =>
    this.get("eventBus").fire("element.changed", {
      element,
    })
  );
};

FragmentModeler.prototype.handleOrgResourceDeleted = function (orgResource) {
  this.getTasksWithOrgResource(orgResource).forEach((element, gfx) => {
    element.businessObject.orgResource = undefined;
    this.get("eventBus").fire("element.changed", {
      element,
    });
  });
};

FragmentModeler.prototype.handleStateRenamed = function (olcState) {
  this.getDataObjectReferencesInState(olcState).forEach((element, gfx) =>
    this.get("eventBus").fire("element.changed", {
      element,
    })
  );
};

FragmentModeler.prototype.handleStateDeleted = function (olcState) {
  this.getDataObjectReferencesInState(olcState).forEach((element, gfx) => {
    element.businessObject.states = without(
      element.businessObject.states,
      olcState
    );
    this.get("eventBus").fire("element.changed", {
      element,
    });
  });
};

FragmentModeler.prototype.handleClassRenamed = function (clazz) {
  this.getDataObjectReferencesOfClass(clazz).forEach((element, gfx) =>
    this.get("eventBus").fire("element.changed", {
      element,
    })
  );
};

FragmentModeler.prototype.handleClassDeleted = function (clazz) {
  this.getDataObjectReferencesOfClass(clazz).forEach((element, gfx) =>
    this.get("modeling").removeElements([element])
  );
};

FragmentModeler.prototype.getDataObjectReferencesInState = function (olcState) {
  return this.get("elementRegistry").filter(
    (element, gfx) =>
      is(element, "bpmn:DataObjectReference") &&
      element.type !== "label" &&
      element.businessObject.states?.includes(olcState)
  );
};

FragmentModeler.prototype.getDataObjectReferencesOfClass = function (clazz) {
  return this.get("elementRegistry").filter(
    (element, gfx) =>
      is(element, "bpmn:DataObjectReference") &&
      element.type !== "label" &&
      clazz.id &&
      element.businessObject.dataclass?.id === clazz.id
  );
};

FragmentModeler.prototype.getTasksWithRole = function (role) {
  let list = this.get("elementRegistry").filter(
    (element, gfx) =>
      is(element, "bpmn:Task") &&
      role.id &&
      element.businessObject.role?.id === role.id
  );
  return list;
};

FragmentModeler.prototype.getTasksWithUnit = function (unit) {
  let list = this.get("elementRegistry").filter(
    (element, gfx) =>
      is(element, "bpmn:Task") &&
      unit.id &&
      element.businessObject.unit?.id === unit.id
  );
  return list;
};

FragmentModeler.prototype.getTasksWithOrgResource = function (orgResource) {
  let list = this.get("elementRegistry").filter(
    (element, gfx) =>
      is(element, "bpmn:Task") &&
      orgResource.id &&
      element.businessObject.orgResource?.id === orgResource.id
  );
  return list;
};

FragmentModeler.prototype.startDoCreation = function (
  event,
  elementShape,
  dataclass,
  isIncoming
) {
  const shape = this.get("elementFactory").createShape({
    type: "bpmn:DataObjectReference",
  });
  shape.businessObject.dataclass = dataclass;
  shape.businessObject.states = [];
  const hints = isIncoming ? { connectionTarget: elementShape } : undefined;
  this.get("autoPlace").append(elementShape, shape, hints);
  // The following works for outgoing data, but breaks the activity for incoming
  // fragmentModeler.get('create').start(event, shape, {
  //   source: activityShape,
  //   hints
  // });
};
