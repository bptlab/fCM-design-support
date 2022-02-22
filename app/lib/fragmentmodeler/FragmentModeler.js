import inherits from 'inherits';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import fragmentPaletteModule from './palette';
import customModelingModule from './modeling';
import bpmnExtension from './moddle/bpmnextension.json';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import { without } from 'min-dash';


export default function FragmentModeler(options) {
    const customModules = [
        fragmentPaletteModule,
        customModelingModule,
        {
            fragmentModeler: ['value', this]
        }
    ];

    options.additionalModules = [
        ...customModules,
        ...(options.additionalModules || [])
    ];

    options.moddleExtensions = {
        fcm: bpmnExtension
    };

    BpmnModeler.call(this, options);
}
inherits(FragmentModeler, BpmnModeler);

FragmentModeler.prototype.handleOlcListChanged = function (olcs, dryRun=false) {
    this._olcs = olcs;
}

FragmentModeler.prototype.handleStateRenamed = function (olcState) {
    this.getDataObjectReferencesInState(olcState).forEach((element, gfx) =>
        this.get('eventBus').fire('element.changed', {
            element
        })
    );
}

FragmentModeler.prototype.handleStateDeleted = function (olcState) {
    this.getDataObjectReferencesInState(olcState).forEach((element, gfx) => {
        element.businessObject.states = without(element.businessObject.states, olcState);
        this.get('eventBus').fire('element.changed', {
            element
        });
    });
}

FragmentModeler.prototype.handleClassRenamed = function (clazz) {
    this.getDataObjectReferencesOfClass(clazz).forEach((element, gfx) =>
        this.get('eventBus').fire('element.changed', {
            element
        })
    );
}

FragmentModeler.prototype.handleClassDeleted = function (clazz) {
    this.getDataObjectReferencesOfClass(clazz).forEach((element, gfx) =>
        this.get('modeling').removeElements([element])
    );
}

FragmentModeler.prototype.getDataObjectReferencesInState = function (olcState) {
    return this.get('elementRegistry').filter((element, gfx) =>
        is(element, 'bpmn:DataObjectReference') &&
        element.type !== 'label' &&
        element.businessObject.states?.includes(olcState)
    );
}

FragmentModeler.prototype.getDataObjectReferencesOfClass = function (clazz) {
    return this.get('elementRegistry').filter((element, gfx) => 
        is(element, 'bpmn:DataObjectReference') &&
        element.type !== 'label' &&
        clazz.id &&
        element.businessObject.dataclass?.id === clazz.id
    );
}

FragmentModeler.prototype.startDoCreation = function(event, elementShape, dataclass, isIncoming) {
    const shape = this.get('elementFactory').createShape({
        type : 'bpmn:DataObjectReference'
    });
    shape.businessObject.dataclass = dataclass;
    shape.businessObject.states = [];
    const hints = isIncoming ?
        {connectionTarget: elementShape}
        : undefined;
    this.get('autoPlace').append(elementShape, shape, hints);
    // The following works for outgoing data, but breaks the activity for incoming
    // fragmentModeler.get('create').start(event, shape, {
    //   source: activityShape,
    //   hints
    // });
}
