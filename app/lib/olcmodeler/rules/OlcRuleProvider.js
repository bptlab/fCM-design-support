import inherits from 'inherits';

import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';

import {is} from '../../util/Util';

export default function OlcRuleProvider(eventBus) {
  RuleProvider.call(this, eventBus);
}

OlcRuleProvider.$inject = ['eventBus'];

inherits(OlcRuleProvider, RuleProvider);


OlcRuleProvider.prototype.init = function () {

  this.addRule('connection.create', function (context) {
    var source = context.source,
      target = context.target;

    return is(source, 'olc:State') && is(target, 'olc:State') && { type: 'olc:Transition' };
  });

  this.addRule('connection.start', function (context) {
    var source = context.source;
    return is(source, 'olc:State') && { type: 'olc:Transition' };
  });
};