import CopyPasteModule from '../copy-paste';
import ReplaceModule from 'diagram-js/lib/features/replace';
import SelectionModule from 'diagram-js/lib/features/selection';

import DataModelReplace from './DataModelReplace';

export default {
    __depends__: [
        CopyPasteModule,
        ReplaceModule,
        SelectionModule
    ],
    dataModelReplace: ['type', DataModelReplace]
};