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
