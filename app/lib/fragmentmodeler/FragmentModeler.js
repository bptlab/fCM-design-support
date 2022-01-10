import BpmnModeler from 'bpmn-js/lib/Modeler';
import resizeAllModule from './resize-all-rules';
import colorPickerModule from './color-picker';
import nyanDrawModule from './nyan/draw';
import nyanPaletteModule from './nyan/palette'; 
import fragmentPaletteModule from './palette';


export default function FragmentModeler(options) {
    return new BpmnModeler({
        additionalModules: [
            fragmentPaletteModule
        ],
        ...options
    });
} 
