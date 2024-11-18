import inherits from 'inherits';
import {findIndex, without} from 'min-dash'

import BaseModeler from './BaseModeler';

import Viewer from './Viewer';
import NavigatedViewer from './NavigatedViewer';

import KeyboardMoveModule from 'diagram-js/lib/navigation/keyboard-move';
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas';
import TouchModule from 'diagram-js/lib/navigation/touch';
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll';

import AlignElementsModule from 'diagram-js/lib/features/align-elements';
import AutoplaceModule from './features/auto-place';
import AutoScrollModule from 'diagram-js/lib/features/auto-scroll';
import BendpointsModule from 'diagram-js/lib/features/bendpoints';
import ConnectionPreviewModule from 'diagram-js/lib/features/connection-preview';
import ConnectModule from 'diagram-js/lib/features/connect';
import ContextPadModule from './features/context-pad';
import CopyPasteModule from './features/copy-paste';
import CreateModule from 'diagram-js/lib/features/create';
import EditorActionsModule from '../common/editor-actions';
import GridSnappingModule from './features/grid-snapping';
import KeyboardModule from '../common/keyboard';
import KeyboardMoveSelectionModule from 'diagram-js/lib/features/keyboard-move-selection';
import LabelEditingModule from './features/label-editing';
import ModelingModule from './features/modeling';
import MoveModule from 'diagram-js/lib/features/move';
import ObjectiveEvents from "./ObjectiveEvents";
import OmButtonBarModule from './buttonbar';
import OmObjectDropdown from './omObjectLabelHandling';
import PaletteModule from './features/palette';
import ResizeModule from 'diagram-js/lib/features/resize';
import SnappingModule from './features/snapping';
import SpaceToolBehaviorModule from './behavior';
import {nextPosition} from '../util/Util';
import {is} from "bpmn-js/lib/util/ModelUtil";

var initialDiagram =
    `<?xml version="1.0" encoding="UTF-8"?>
<om:definitions xmlns:om="http://tk/schema/od" xmlns:odDi="http://tk/schema/odDi">
    <om:odBoard id="Board" />
    <odDi:odRootBoard id="StartBoard" name="Start State" objectiveRef="start_state">
        <odDi:odPlane id="Plane" boardElement="Board" />
    </odDi:odRootBoard>
</om:definitions>`;

export default function OmModeler(options) {
    BaseModeler.call(this, options);
}

inherits(OmModeler, BaseModeler);


OmModeler.Viewer = Viewer;
OmModeler.NavigatedViewer = NavigatedViewer;

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
OmModeler.prototype.createDiagram = function () {
    return this.importXML(initialDiagram);
};


OmModeler.prototype._interactionModules = [

    // non-modeling components
    KeyboardMoveModule,
    MoveCanvasModule,
    OmButtonBarModule,
    TouchModule,
    ZoomScrollModule
];

OmModeler.prototype._modelingModules = [

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
    OmObjectDropdown,
    PaletteModule,
    ResizeModule,
    SnappingModule,
    SpaceToolBehaviorModule
];


// modules the modeler is composed of
//
// - viewer modules
// - interaction modules
// - modeling modules

OmModeler.prototype._modules = [].concat(
    Viewer.prototype._modules,
    OmModeler.prototype._interactionModules,
    OmModeler.prototype._modelingModules
);

OmModeler.prototype.id = "OM";
OmModeler.prototype.rank = 3;

OmModeler.prototype.name = function (constructionMode) {
    if (constructionMode) {
        return "Milestones";
    } else {
        return "Objective Model";
    }
}

OmModeler.prototype.createObject = function (name) {
    const modeling = this.get('modeling');
    const canvas = this.get('canvas');
    const diagramRoot = canvas.getRootElement();

    const {x, y} = nextPosition(this, 'om:Object');
    const shape = modeling.createShape({
        type: 'om:Object',
        name: name
    }, {x, y}, diagramRoot);
    return shape.businessObject;
}

OmModeler.prototype.renameObject = function (object, name) {
    this.get('modeling').updateLabel(this.get('elementRegistry').get(object.id), name);
}

OmModeler.prototype.deleteObject = function (object) {
    this.get('modeling').removeShape(object);
}

OmModeler.prototype.updateProperty = function (object, property) {
    this.get('modeling').updateProperties(object, property);
}

OmModeler.prototype.getObjectives = function () {
    return this._definitions.get('rootBoards');
}

OmModeler.prototype.showObjective = function (objective) {
    const container = this.get('canvas').getContainer();
    this._objective = objective;
    this.clear();
    if (objective) {
        container.style.visibility = '';
        this.open(objective);
    } else {
        container.style.visibility = 'hidden';
    }
}

OmModeler.prototype.getCurrentObjective = function () {
    return this._objective;
}

OmModeler.prototype.addObjective = function (objectiveReference) {
    var rootBoard = this.get('elementFactory').createRootBoard(objectiveReference.name || 'undefined', objectiveReference);
    this._definitions.get('rootBoards').push(rootBoard[0]);
    this._definitions.get('rootElements').push(rootBoard[1]);
    this._emit(ObjectiveEvents.DEFINITIONS_CHANGED, {definitions: this._definitions});
    this.showObjective(rootBoard[0]);
}

OmModeler.prototype.deleteObjective = function (objectiveReference) {
    var objective = this.getObjectiveByReference(objectiveReference);
    if (objective.id !== 'StartBoard') {
        var currentIndex = findIndex(this._definitions.get('rootElements'), objective.plane.boardElement);
        this._definitions.get('rootElements').splice(currentIndex, 1);

        currentIndex = findIndex(this._definitions.get('rootBoards'), objective);
        var indexAfterRemoval = Math.min(currentIndex, this._definitions.get('rootBoards').length - 2);
        this._definitions.get('rootBoards').splice(currentIndex, 1);
        this._emit(ObjectiveEvents.DEFINITIONS_CHANGED, {definitions: this._definitions});

        if (this.getCurrentObjective() === objective) {
            this.showObjective(this._definitions.get('rootBoards')[indexAfterRemoval]);
        }
    }
}

OmModeler.prototype.renameObjective = function (objectiveReference, name) {
    var objective = this.getObjectiveByReference(objectiveReference);
    objective.name = name;
    this._emit(ObjectiveEvents.DEFINITIONS_CHANGED, {definitions: this._definitions});
}

OmModeler.prototype.createInstance = function (name, clazz) {
    const objectInstance = this.get('elementFactory').createObjectInstance(name, clazz);
    this._definitions.get('objectInstances').push(objectInstance);
    return objectInstance;
}

OmModeler.prototype.renameInstance = function (instance, name) {
    instance.name = name;
    this.getVisualsWithInstance(instance).forEach(element => {
        this.get('eventBus').fire('element.changed', {
            element
        })
    });
}

OmModeler.prototype.deleteInstance = function (instance) {
    let changedVisuals = this.getVisualsWithInstance(instance);
    this.getObjectsWithInstance(instance).forEach(element => {
        element.instance = undefined;
    });
    changedVisuals.forEach(element =>
        this.get('eventBus').fire('element.changed', {
            element
        })
    );
    let instances = this._definitions.get('objectInstances');
    let index = instances.indexOf(instance);
    if (index > -1) {
        instances.splice(index, 1);
    }
}

OmModeler.prototype.handleOlcListChanged = function (olcs, dryRun = false) {
    this._olcs = olcs;
}

OmModeler.prototype.handleStateRenamed = function (olcState) {
    this.getVisualsInState(olcState).forEach(element =>
        this.get('eventBus').fire('element.changed', {
            element
        })
    );
}

OmModeler.prototype.handleStateDeleted = function (olcState) {
    let changedVisual = this.getVisualsInState(olcState);
    this.getObjectsInState(olcState).forEach(element => {
        element.states = without(element.states, olcState);
    });
    changedVisual.forEach(element =>
        this.get('eventBus').fire('element.changed', {
            element
        })
    );
}

OmModeler.prototype.handleClassRenamed = function (clazz) {
    this.getVisualsOfClass(clazz).forEach(element => {
        this.get('eventBus').fire('element.changed', {
            element
        })
    });
}

OmModeler.prototype.handleClassDeleted = function (clazz) {
    let objectives = this._definitions.get('rootElements');
    objectives.forEach(objective => {
        let elements = objective.get('boardElements');

        for (let i = 0; i < elements.length; i++) {
            if (this.isObjectOfDeletedClass(clazz, elements[i]) || this.isLinkConnectedToObjectOfDeletedClass(clazz, elements[i])) {
                elements.splice(i, 1);
                i--;
            }
        }
    })

    let instances = this._definitions.get('objectInstances');
    for (let i = 0; i < instances.length; i++) {
        if (clazz.id && instances[i].classRef?.id === clazz.id) {
            instances.splice(i, 1);
            i--;
        }
    }
    this.showObjective(this.getCurrentObjective());
    // This is needed to update the visual representation of the objective that is currently loaded.
    // This may need to be adapted once the error of links between deleted objects is resolved
}

OmModeler.prototype.getVisualsInState = function (olcState) {
    return this.get('elementRegistry').filter(element =>
        is(element, 'om:Object') &&
        olcState.id &&
        element.businessObject.states?.some(state => state.id === olcState.id)
    );
}

OmModeler.prototype.getObjectsInState = function (olcState) {
    let objectives = this._definitions.get('rootElements');
    let objects = objectives.map(objective => objective.get('boardElements')).flat(1).filter((element) =>
        is(element, 'om:Object') &&
        olcState.id &&
        element.states?.some(state => state.id === olcState.id));
    return objects;
}

OmModeler.prototype.getVisualsOfClass = function (clazz) {
    return this.get('elementRegistry').filter(element =>
        is(element, 'om:Object') &&
        clazz.id &&
        element.businessObject.classRef?.id === clazz.id
    );
}

OmModeler.prototype.getVisualsWithInstance = function (instance) {
    return this.get('elementRegistry').filter(element =>
        is(element, 'om:Object') &&
        instance.id &&
        element.businessObject.instance?.id === instance.id
    );
}

OmModeler.prototype.getObjectsWithInstance = function (instance) {
    let objectives = this._definitions.get('rootElements');
    let objects = objectives.map(objective => objective.get('boardElements')).flat(1).filter((element) =>
        is(element, 'om:Object') &&
        instance.id &&
        element.instance?.id === instance.id);
    return objects;
}

OmModeler.prototype.getObjectsOfClass = function (clazz) {
    let objectives = this._definitions.get('rootElements');
    let objects = objectives.map(objective => objective.get('boardElements')).flat(1).filter((element) =>
        is(element, 'om:Object') &&
        clazz.id &&
        element.classRef?.id === clazz.id);
    return objects;
}

OmModeler.prototype.getObjectInstancesOfClass = function (clazz) {
    let instances = this._definitions.get('objectInstances');
    return instances.filter(instance =>
        is(instance, 'om:ObjectInstance') &&
        clazz.id &&
        instance.classRef?.id === clazz.id
    );
}

OmModeler.prototype.getObjectiveByReference = function (objectiveReference) {
    const objective = this.getObjectives().filter(objective => objective.objectiveRef === objectiveReference)[0];
    if (!objective) {
        throw 'Unknown rootBoard of objective \"' + objectiveReference.name + '\"';
    } else {
        return objective;
    }
}

OmModeler.prototype.isObjectOfDeletedClass = function (clazz, element) {
    return is(element, 'om:Object') && clazz.id && element.classRef?.id === clazz.id;
}

OmModeler.prototype.isLinkConnectedToObjectOfDeletedClass = function (clazz, element) {
    return is(element, 'om:Link') && clazz.id && ((element.sourceRef?.classRef?.id === clazz.id) || (element.targetRef?.classRef?.id === clazz.id));
}