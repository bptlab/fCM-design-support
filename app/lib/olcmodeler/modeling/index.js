import CommandModule from 'diagram-js/lib/command';
import CroppingConnectionDocking from 'diagram-js/lib/layout/CroppingConnectionDocking';

import OlcUpdater from './OlcUpdater';
import OlcElementFactory from './OlcElementFactory';


export default {
  __init__: [
    'olcUpdater'
  ],
  __depends__: [
    CommandModule
  ],
  elementFactory: [ 'type', OlcElementFactory ],
  olcUpdater: [ 'type', OlcUpdater ],
  connectionDocking: [ 'type', CroppingConnectionDocking ]
};