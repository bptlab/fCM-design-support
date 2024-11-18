import {is} from '../../util/Util';

import inherits from 'inherits';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';

export default function DepRuleProvider(eventBus, elementRegistry) {
    this._elementRegistry = elementRegistry;
    RuleProvider.call(this, eventBus);
}

DepRuleProvider.$inject = [
    'eventBus',
    'elementRegistry'
];

inherits(DepRuleProvider, RuleProvider);

DepRuleProvider.prototype.init = function () {
    var self = this;
    this.addRule('connection.create', function (context) {
        var {source, target} = context;

        // There must not be more than one transition between two states
        var existingConnections = self._elementRegistry.filter(function (element) {
            return is(element, 'dep:Dependency') &&
                ((element.source === source && element.target === target) || (element.source === target && element.target === source));
        });

        return is(source, 'dep:Objective') && is(target, 'dep:Objective')
            && existingConnections.length === 0
            && source !== target && target.id !== 'start_state' && {type: 'dep:Dependency'};
    });

    this.addRule('connection.start', function (context) {
        var source = context.source;
        return is(source, 'dep:Objective') && {type: 'dep:Dependency'};
    });

    this.addRule('shape.resize', function () {
        return false;
    });

    this.addRule('element.copy', function () {
        return true;
    });
}