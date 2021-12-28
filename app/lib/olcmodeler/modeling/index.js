import CommandModule from 'diagram-js/lib/command';
import CroppingConnectionDocking from 'diagram-js/lib/layout/CroppingConnectionDocking';

import OlcUpdater from './OlcUpdater';


export default {
  __init__: [
    'olcUpdater'
  ],
  __depends__: [
    CommandModule
  ],
  olcUpdater: [ 'type', OlcUpdater ],
  connectionDocking: [ 'type', CroppingConnectionDocking ]
};