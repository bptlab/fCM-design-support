import inherits from 'inherits';

import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';


export default function OlcRuleProvider(eventBus) {
  RuleProvider.call(this, eventBus);
}

OlcRuleProvider.$inject = ['eventBus'];

inherits(OlcRuleProvider, RuleProvider);


OlcRuleProvider.prototype.init = function () {

  this.addRule('connection.create', function (context) {
    var source = context.source,
      target = context.target;

    return source.type === 'olc:State' && target.type === 'olc:State' && { type: 'olc:Transition' };//TODO is(element, 'olc:State');
  });

  this.addRule('connection.start', function (context) {
    var source = context.source;
    return source.type === 'olc:State' && { type: 'olc:Transition' };//TODO is(element, 'olc:State');
  });
};