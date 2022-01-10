import BpmnModeler from 'bpmn-js/lib/Modeler';
import fragmentPaletteModule from './palette';


export default function FragmentModeler(options) {
    return new BpmnModeler({
        additionalModules: [
            fragmentPaletteModule
        ],
        ...options
    });
} 
