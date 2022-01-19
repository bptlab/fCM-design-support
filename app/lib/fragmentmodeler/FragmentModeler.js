import inherits from 'inherits';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import fragmentPaletteModule from './palette';
import customModelingModule from './modeling';
import bpmnExtension from './moddle/bpmnextension.json';


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

FragmentModeler.prototype.handleOlcListChanged = function (classes, dryRun=false) {
    this._classes = classes;
}

FragmentModeler.prototype.handleStateRenamed = function (state) {
    // TODO called when an olc state is renamed
}

FragmentModeler.prototype.handleStateDeleted = function (state) {
    // TODO called when an olc state is deleted
}

FragmentModeler.prototype.handleClassRenamed = function (clazz) {
    // TODO called when a data class is renamed
}

FragmentModeler.prototype.handleClassDeleted = function (clazz) {
    // TODO called when a data class is deleted
}
