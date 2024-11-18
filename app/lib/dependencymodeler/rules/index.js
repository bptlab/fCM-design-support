import DepRuleProvider from './DepRuleProvider';

import RulesModule from 'diagram-js/lib/features/rules';

export default {
    __depends__: [
        RulesModule
    ],
    __init__: ['depRuleProvider'],
    depRuleProvider: ['type', DepRuleProvider]
};
