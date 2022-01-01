import CommandModule from 'diagram-js/lib/command';
import DirectEditingModule from 'diagram-js-direct-editing';
import CroppingConnectionDocking from 'diagram-js/lib/layout/CroppingConnectionDocking';

import OlcUpdater from './OlcUpdater';
import OlcElementFactory from './OlcElementFactory';
import OlcLabelEditing from './OlcLabelEditing';
import OlcModeling from './OlcModeling';


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
  elementFactory: [ 'type', OlcElementFactory ],
  olcUpdater: [ 'type', OlcUpdater ],
  olcLabelEditing: ['type', OlcLabelEditing],
  modeling: ['type', OlcModeling],

  connectionDocking: [ 'type', CroppingConnectionDocking ]
};