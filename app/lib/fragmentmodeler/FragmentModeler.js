import inherits from 'inherits';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import fragmentPaletteModule from './palette';


export default function FragmentModeler(options) {
    var customModules = [
        fragmentPaletteModule,
        {
            fragmentModeler: ['value', this]
        }
    ];
    options.additionalModules = [
        ...customModules,
        ...(options.additionalModules || [])
    ];
    BpmnModeler.call(this, options);
}
inherits(FragmentModeler, BpmnModeler);

FragmentModeler.prototype.handleOlcListChanged = function (classes, dryRun=false) {
    // TODO called when olc list changes, i.e. a class is deleted or added, will later be replaced by events from the class modeler
}

FragmentModeler.prototype.handleStateRenamed = function (state) {
    // TODO called when an olc state is renamed
}

FragmentModeler.prototype.handleStateDeleted = function (state) {
    // TODO called when an olc state is deleted
}
