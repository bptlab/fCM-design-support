import CommandModule from 'diagram-js/lib/command';
import DirectEditingModule from 'diagram-js-direct-editing';
import CroppingConnectionDocking from 'diagram-js/lib/layout/CroppingConnectionDocking';

import OlcUpdater from './OlcUpdater';
import OlcElementFactory from './OlcElementFactory';
import OlcLabelEditing from './OlcLabelEditing';
import Modeling from '../../common/modeling/Modeling';


export default {
    __init__: [
        'modeling',
        'olcUpdater',
        'olcLabelEditing'
    ],
    __depends__: [
        CommandModule,
        DirectEditingModule
    ],
    elementFactory: ['type', OlcElementFactory],
    olcUpdater: ['type', OlcUpdater],
    olcLabelEditing: ['type', OlcLabelEditing],
    modeling: ['type', Modeling],

    connectionDocking: ['type', CroppingConnectionDocking]
};