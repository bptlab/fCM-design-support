import inherits from "inherits";

import BaseModeler from "./BaseModeler";

import Viewer from "./Viewer";
import NavigatedViewer from "./NavigatedViewer";

import KeyboardMoveModule from "diagram-js/lib/navigation/keyboard-move";
import MoveCanvasModule from "diagram-js/lib/navigation/movecanvas";
import TouchModule from "diagram-js/lib/navigation/touch";
import ZoomScrollModule from "diagram-js/lib/navigation/zoomscroll";

import AlignElementsModule from "diagram-js/lib/features/align-elements";
import AutoScrollModule from "diagram-js/lib/features/auto-scroll";
import BendpointsModule from "diagram-js/lib/features/bendpoints";
import ConnectModule from "diagram-js/lib/features/connect";
import ConnectionPreviewModule from "diagram-js/lib/features/connection-preview";
import ContextPadModule from "./features/context-pad";
import CopyPasteModule from "./features/copy-paste";
import CreateModule from "diagram-js/lib/features/create";
import EditorActionsModule from "./features/editor-actions";
import GridSnappingModule from "./features/grid-snapping";
import KeyboardModule from "./features/keyboard";
import AutoplaceModule from "./features/auto-place";
import KeyboardMoveSelectionModule from "diagram-js/lib/features/keyboard-move-selection";
import LabelEditingModule from "./features/label-editing";
import ModelingModule from "./features/modeling";
import MoveModule from "diagram-js/lib/features/move";
import PaletteModule from "./features/palette";
import ResizeModule from "diagram-js/lib/features/resize";
import SnappingModule from "./features/snapping";
import taskLabelHandling from "./roleLabelHandling";
import { is } from "bpmn-js/lib/util/ModelUtil";
import { nextPosition } from "../util/Util";

var initialDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<rom:definitions xmlns:rom="http://tk/schema/od" xmlns:odDi="http://tk/schema/odDi">
    <rom:odBoard id="Board_debug" />
    <odDi:odRootBoard id="RootBoard_debug">
        <odDi:odPlane id="Plane_debug" boardElement="Board_debug" />
    </odDi:odRootBoard>
</rom:definitions>`;

export default function RoleModeler(options) {
  BaseModeler.call(this, options);
}

inherits(RoleModeler, BaseModeler);

RoleModeler.Viewer = Viewer;
RoleModeler.NavigatedViewer = NavigatedViewer;

/**
 * The createDiagram result.
 *
 * @typedef {Object} CreateDiagramResult
 *
 * @property {Array<string>} warnings
 */

/**
 * The createDiagram error.
 *
 * @typedef {Error} CreateDiagramError
 *
 * @property {Array<string>} warnings
 */

/**
 * Create a new diagram to start modeling.
 *
 * @returns {Promise<CreateDiagramResult, CreateDiagramError>}
 *
 */
RoleModeler.prototype.createDiagram = function () {
  return this.importXML(initialDiagram);
};

RoleModeler.prototype._interactionModules = [
  // non-modeling components
  KeyboardMoveModule,
  MoveCanvasModule,
  TouchModule,
  ZoomScrollModule,
];

RoleModeler.prototype._modelingModules = [
  // modeling components
  AutoplaceModule,
  AlignElementsModule,
  AutoScrollModule,
  BendpointsModule,
  ConnectModule,
  ConnectionPreviewModule,
  ContextPadModule,
  CopyPasteModule,
  CreateModule,
  EditorActionsModule,
  GridSnappingModule,
  KeyboardModule,
  KeyboardMoveSelectionModule,
  LabelEditingModule,
  ModelingModule,
  MoveModule,
  PaletteModule,
  ResizeModule,
  SnappingModule,
  taskLabelHandling,
];

// modules the modeler is composed of
//
// - viewer modules
// - interaction modules
// - modeling modules

RoleModeler.prototype._modules = [].concat(
  Viewer.prototype._modules,
  RoleModeler.prototype._interactionModules,
  RoleModeler.prototype._modelingModules
);

RoleModeler.prototype.id = "ROM";
RoleModeler.prototype.rank = 5;

RoleModeler.prototype.name = function (constructionMode) {
  if (constructionMode) {
    return "Organizational Chart Modeler";
  } else {
    return "Organizational Chart Modeler";
  }
};

RoleModeler.prototype.createRole = function (name) {
  const modeling = this.get("modeling");
  const canvas = this.get("canvas");
  const diagramRoot = canvas.getRootElement();

  const { x, y } = nextPosition(this, "rom:Position");
  const shape = modeling.createShape(
    {
      type: "rom:Position",
      name: name,
    },
    { x, y },
    diagramRoot
  );
  return shape.businessObject;
};

RoleModeler.prototype.getRoles = function () {
  return this.get("elementRegistry")
    .filter((element) => is(element, "rom:Position"))
    .map((element) => element.businessObject);
};

RoleModeler.prototype.createUnit = function (name) {
  const modeling = this.get("modeling");
  const canvas = this.get("canvas");
  const diagramRoot = canvas.getRootElement();

  const { x, y } = nextPosition(this, "rom:OrganizationalUnit");
  const shape = modeling.createShape(
    {
      type: "rom:OrganizationalUnit",
      name: name,
    },
    { x, y },
    diagramRoot
  );
  return shape.businessObject;
};

RoleModeler.prototype.getUnits = function () {
  return this.get("elementRegistry")
    .filter((element) => is(element, "rom:OrganizationalUnit"))
    .map((element) => element.businessObject);
};

RoleModeler.prototype.createOrgResource = function (name) {
  const modeling = this.get("modeling");
  const canvas = this.get("canvas");
  const diagramRoot = canvas.getRootElement();

  const { x, y } = nextPosition(this, "rom:OrgResource");
  const shape = modeling.createShape(
    {
      type: "rom:OrgResource",
      name: name,
    },
    { x, y },
    diagramRoot
  );
  return shape.businessObject;
};

RoleModeler.prototype.getOrgResources = function () {
  return this.get("elementRegistry")
    .filter((element) => is(element, "rom:OrgResource"))
    .map((element) => element.businessObject);
};
