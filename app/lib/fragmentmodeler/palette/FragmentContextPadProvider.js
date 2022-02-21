import { is } from'../../util/Util';

export default class FragmentContextPadProvider {
	constructor(contextPad, autoPlace, create, elementFactory, translate) {
		this.autoPlace = autoPlace;
		this.create = create;
		this.elementFactory = elementFactory;
		this.translate = translate;

		contextPad.registerProvider(this);
	}
  
	getContextPadEntries(element) {
		const { autoPlace, create, elementFactory, translate } = this;

		return function(entries) {
			delete entries["append.end-event"];
			delete entries["append.text-annotation"];

			if (is(element, 'bpmn:Activity')) {

				function appendDataObjectReference(event, element) {
					if (autoPlace) {
						const shape = elementFactory.createShape({ type: 'bpmn:DataObjectReference' });
						shape.businessObject.dataclass = undefined;
						shape.businessObject.states = [];

						autoPlace.append(element, shape);
					} else {
						appendDataObjectReferenceStart(event);
					}
				}

				function appendDataObjectReferenceStart(event) {
					const shape = elementFactory.createShape({ type: 'bpmn:DataObjectReference' });
					shape.businessObject.dataclass = undefined;
					shape.businessObject.states = [];

					create.start(event, shape, { source: element });
				}

				entries['append.data-object-reference'] = {
					group: 'model',
					className: 'bpmn-icon-data-object',
					title: translate('Create Data Object Reference'),
					action: {
						click: appendDataObjectReference,
						dragstart: appendDataObjectReferenceStart
					}
				}
			}

			return entries;
		};
	}
}

FragmentContextPadProvider.$inject = [
	'contextPad',
	'autoPlace',
	'create',
	'elementFactory',
	'translate'
];
