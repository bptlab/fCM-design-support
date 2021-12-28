import RulesModule from 'diagram-js/lib/features/rules';

import OlcRuleProvider from './OlcRuleProvider';

export default {
  __depends__: [
    RulesModule
  ],
  __init__: [ 'olcRuleProvider' ],
  olcRuleProvider: [ 'type', OlcRuleProvider ]
};