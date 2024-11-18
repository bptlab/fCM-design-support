import DepUpdater from './DepUpdater';
import DepElementFactory from './DepElementFactory';
import DepLabelEditing from './DepLabelEditing';
import Modeling from './Modeling';

import CommandModule from 'diagram-js/lib/command';
import DirectEditingModule from 'diagram-js-direct-editing';
import CroppingConnectionDocking from 'diagram-js/lib/layout/CroppingConnectionDocking';

export default {
    __init__: [
        'modeling',
        'depUpdater',
        'depLabelEditing'
    ],
    __depends__: [
        CommandModule,
        DirectEditingModule
    ],
    elementFactory: ['type', DepElementFactory],
    depUpdater: ['type', DepUpdater],
    depLabelEditing: ['type', DepLabelEditing],
    modeling: ['type', Modeling],

    connectionDocking: ['type', CroppingConnectionDocking]
};