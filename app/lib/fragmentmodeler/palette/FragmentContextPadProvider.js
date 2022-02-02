export default class FragmentContextPadProvider {
	constructor(contextPad) {
		contextPad.registerProvider(this);
	}
  
	getContextPadEntries(element) {
		return function(entries) {
			delete entries["append.end-event"];
			delete entries["append.text-annotation"];

			return entries;
		};
	}
}

FragmentContextPadProvider.$inject = [
	'contextPad'
];
