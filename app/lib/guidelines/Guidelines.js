import { is } from '../datamodelmodeler/util/ModelUtil';
import { getConnectedElements } from './fragment_guidelines/connected_components';

export const SEVERITY = {
    ERROR : {
        cssClass : 'errorElement',
        label : 'Errors'
    },
    WARNING : {
        cssClass : 'warningElement',
        label : 'Warnings'
    }
}
const severityKeys = Object.keys(SEVERITY)
severityKeys.forEach(key => SEVERITY[key].key = key);
SEVERITY.forEach = function(lambda) {
    return severityKeys.map(key => SEVERITY[key]).forEach(lambda);
}
SEVERITY.filter = function(lambda) {
    return severityKeys.map(key => SEVERITY[key]).filter(lambda);
}

// TODO let guidelines return businessobject instead of elements
export default [
    {
        title : 'Development Guideline',
        id : 'eins',
        getViolations(mediator) {
            var olcs = mediator.olcModelerHook.modeler.getOlcs();
            var states = olcs.flatMap(olc => olc.get('Elements')).filter(element => is(element, 'olc:State'));
            return states.filter(state => !state.name?.endsWith('cake')).map(state => ({
                element : state,
                message : 'Please make state ' + state.name + ' a cake.'
            }));
        },
        severity : SEVERITY.ERROR,
        link : 'https://de.wikipedia.org/wiki/Kuchen'
    },
    {
        title : 'Development Guideline #2',
        id : 'zwei',
        getViolations(mediator) {
            const olcModeler = mediator.olcModelerHook.modeler;
            var olcs = mediator.olcModelerHook.modeler.getOlcs();
            var states = olcs.flatMap(olc => olc.get('Elements')).filter(element => is(element, 'olc:State'));
            return states.filter(state => state.name !== 'Cheesecake').map(state => ({
                element : state,
                message : 'Please make state ' + state.name + ' more delicious.',
                quickFixes : [
                    {
                        label : 'Change title of state to cheesecake',
                        action : () => olcModeler.get('modeling').updateLabel(olcModeler.get('elementRegistry').get(state.id), 'Cheesecake')
                    },
                    {
                        label : 'Delete state',
                        action : () => olcModeler.get('modeling').removeElements([olcModeler.get('elementRegistry').get(state.id)])
                    }
                ]
            }));
        },
        severity : SEVERITY.WARNING,
        link : 'https://de.wikipedia.org/wiki/Käsekuchen'
    },
    {
        title : 'Development Guideline #3',
        id : 'drei',
        getViolations(mediator) {
            const dataModeler = mediator.dataModelerHook.modeler;

            return dataModeler.get('elementRegistry').getAll().filter(element => is(element, 'od:Class')).map(clazz => ({
                element : clazz.businessObject,
                message : 'XX'
            }));
        },
        severity : SEVERITY.WARNING,
        link : 'https://de.wikipedia.org/wiki/Käsekuchen'
    },
    {
        title : 'O4: Define meaningful state lables',
        id : 'O4',
        getViolations(mediator) {
            var olcs = mediator.olcModelerHook.modeler.getOlcs();
            var states = olcs.flatMap(olc => olc.get('Elements')).filter(element => is(element, 'olc:State'));
            var ex = new RegExp("(ed$|ready|initial)");
            return states.filter(state => !(state.name || '').match(ex)).map(state => ({
                element : state,
                message : 'State "' + state.name + '" has no meaningful state label. Consider changing it to past tense'
            }));
        },
        severity : SEVERITY.WARNING,
        link : 'https://github.com/bptlab/fCM-design-support/wiki/Object-Lifecycle-(OLC)#o4---define-meaningful-state-labels'
    },
   {
       title : 'GS2: Include all relevant data objects in the goal',
       id : 'GS2',
       getViolations(mediator) {
           const hook = mediator.goalStateModelerHook;
           const literals = hook.modeler.getLiterals();
           if (literals && literals.length === 0) {
               return [{
                   element : hook.getRootObject(),
                   message : 'Please include at least one data object configuration as literal in the goal state.'
               }];
           } else {
               return [];
           }
       },
       severity : SEVERITY.ERROR,
       link : 'https://github.com/bptlab/fCM-design-support/wiki/Goal-State#gs2---include-all-relevant-data-objects-in-the-goal-state'
   },
    {
        title: 'F9: Do not use gateways at the beginning of a fragment',
        id: 'F9',
        getViolations(mediator) {
            const gateways = mediator.fragmentModelerHook.modeler.get('elementRegistry').filter(element => is(element, 'bpmn:Gateway'));
            gateways.filter(gateway => gateway.incoming.length === 0);
            return gateways.filter(gateway => gateway.incoming.length === 0).map(gateway => ({
                element: gateway.businessObject,
                message: 'Gateways should not be used at the beginning of a fragment'
            }));
        },
        severity: SEVERITY.ERROR,
        link: 'https://github.com/bptlab/fCM-design-support/wiki/Fragments#f9---do-not-use-gateways-at-the-beginning-of-a-fragment'
    },
    {
        title: 'F3: Use at least one activity for a fragment',
        id: 'F3',
        getViolations(mediator) {
            const elements = mediator.fragmentModelerHook.modeler.get('elementRegistry').filter(element =>
                is(element, 'bpmn:Activity') || is(element, 'bpmn:Event') || is(element, 'bpmn:Gateway') ||
                (is(element, 'bpmn:DataObjectReference') && !(element.type === 'label')));
            const connectedElements = new Set();
            const activities = mediator.fragmentModelerHook.modeler.get('elementRegistry').filter(element => is(element, 'bpmn:Activity'));
            for (const activity of activities) {
                if (connectedElements.has(activity)) {
                    continue;
                }
                getConnectedElements(activity).forEach(element => connectedElements.add(element));
            }
            return elements.filter(element => !connectedElements.has(element)).map(element => ({
                element: element.businessObject,
                message: 'Each fragment should comprise at least one activity'
            }));
        },
        severity: SEVERITY.ERROR,
        link: 'https://github.com/bptlab/fCM-design-support/wiki/Fragments#f3---use-at-least-one-activity-for-a-fragment'
    },
    {
        title: 'F11: Label notations elements',
        id: 'F11',
        getViolations(mediator) {
            const elements = mediator.fragmentModelerHook.modeler.get('elementRegistry').filter(element =>
                is(element, 'bpmn:Activity') || is(element, 'bpmn:Event') || is(element, 'bpmn:Gateway') ||
                (is(element, 'bpmn:DataObjectReference') && !(element.type === 'label')));
            return elements.filter(element => !element.businessObject.name).map(element => ({
                element: element.businessObject,
                message: 'Each fragment element should have an appropriate label.'
            }));
        },
        severity: SEVERITY.ERROR,
        link: 'https://github.com/bptlab/fCM-design-support/wiki/Fragments#f11---label-notation-elements'
    },
    {
        title : 'Use states instead of attributes for important data changes',
        id : 'D5',
        getViolations(mediator) {
            const dataModeler = mediator.dataModelerHook.modeler;
            const clazzes = dataModeler.get('elementRegistry').getAll().filter(element => is(element, 'od:Class'));
            return clazzes.filter(element => element.businessObject.attributeValues).map(clazz => ({
                element : clazz.businessObject,
                message : 'Attributes are only used very rarely. Consider using states instead.'
            }));
        },
        severity : SEVERITY.WARNING,
        link : 'https://github.com/bptlab/fCM-design-support/wiki/Data-Model#d5---use-states-instead-of-attributes-for-important-data-changes'
    },
    {
        title: 'F4: Use data objects to model pre- and postconditions',
        id: 'F4',
        getViolations(mediator) {
            const activities = mediator.fragmentModelerHook.modeler.get('elementRegistry').filter(element =>
                is(element, 'bpmn:Activity'));
            const activites_with_data = [];
            for (let i = 0; i < activities.length; i++) {
                for (let y = 0; y < activities[i].outgoing.length; y++) {
                    if (activities[i].outgoing[y].type === 'bpmn:DataOutputAssociation') {
                        activites_with_data.push(activities[i]);
                    }
                }
                for (let z = 0; z < activities[i].incoming.length; z++) {
                    if (activities[i].incoming[z].type === 'bpmn:DataInputAssociation') {
                        activites_with_data.push(activities[i]);
                    }
                }
            }
            return activities.filter(element => !activites_with_data.includes(element)).map(element => ({
                element: element.businessObject,
                message: 'Consider using a data object to model a pre- and postcondition for this activity.'
            }));
        },
        severity: SEVERITY.WARNING,
        link: 'https://github.com/bptlab/fCM-design-support/wiki/Fragments#f4---use-data-objects-to-model-pre--and-postconditions'
    },
    {
        title: 'F6A: Use at least one start event',
        id: 'F6A',
        getViolations(mediator) {
            const hook = mediator.fragmentModelerHook;
            const startEvents = hook.modeler.get('elementRegistry').filter(element => is(element, 'bpmn:StartEvent') && element.type !== 'label');
            if (startEvents.length === 0) {
                return [{
                    element: hook.getRootObject(),
                    message: 'Please use at least one start event in the fragment model'
                }];
            } else {
                return [];
            }
        },
        severity: SEVERITY.ERROR,
        link: 'https://github.com/bptlab/fCM-design-support/wiki/Fragments#f6---use-start-events-only-in-initial-fragments'
    },
    {
        title: 'F6B: Use multiple start events carefully',
        id: 'F6B',
        getViolations(mediator) {
            const hook = mediator.fragmentModelerHook;
            const startEvents = hook.modeler.get('elementRegistry').filter(element => is(element, 'bpmn:StartEvent') && element.type !== 'label');
            if (startEvents.length > 1) {
                return startEvents.map(element => ({
                    element: element.businessObject,
                    message: 'Process has multiple start events. Please ensure that this is intended.'
                }));
            } else {
                return [];
            }
        },
        severity: SEVERITY.WARNING, // TODO candidate for lower severity
        link: 'https://github.com/bptlab/fCM-design-support/wiki/Fragments#f6---use-start-events-only-in-initial-fragments'
    },
]