import { is } from '../datamodelmodeler/util/ModelUtil';
import { type } from '../util/Util';
import { getClassDependencies, getClassDependents, getConnectedByExistentialAssociation, getConnectedElements, startDoCreation } from './GuidelineUtils';

export const SEVERITY = {
    ERROR : {
        cssClass : 'errorElement',
        label : 'Errors'
    },
    WARNING : {
        cssClass : 'warningElement',
        label : 'Warnings'
    },
    INFORMATION : {
        cssClass : 'informationElement',
        label : 'Information'
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

export default [
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
                message: 'Please do not use a gateway at the start of a fragment.'
            }));
        },
        severity: SEVERITY.ERROR,
        link: 'https://github.com/bptlab/fCM-design-support/wiki/Fragments#f9---do-not-use-gateways-at-the-beginning-of-a-fragment'
    },
    {
        title: 'F3: Use at least one activity for a fragment',
        id: 'F3',
        getViolations(mediator) {
            const elements = mediator.fragmentModelerHook.modeler.get('elementRegistry').filter(element => (is(element, 'bpmn:FlowNode') || is(element, 'bpmn:DataObjectReference')) && element.type !== 'label');
            const connectedElements = new Set();
            const activities = mediator.fragmentModelerHook.modeler.get('elementRegistry').filter(element => is(element, 'bpmn:Activity'));
            for (const activity of activities) {
                if (connectedElements.has(activity)) {
                    continue;
                }
                getConnectedElements(activity).forEach(element => connectedElements.add(element.id));
            }
            return elements.filter(element => !connectedElements.has(element.id)).map(element => ({
                element: element.businessObject,
                message: 'Please connect this ' + type(element.businessObject) + ' to a component with an activity.'
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
                is(element, 'bpmn:Activity') || is(element, 'bpmn:Event') || (is(element, 'bpmn:DataObjectReference') && !(element.type === 'label')));
            return elements.filter(element => !element.businessObject.name).map(element => ({
                element: element.businessObject,
                message: 'Please provide a label for each fragment element.'
            }));
        },
        severity: SEVERITY.ERROR,
        link: 'https://github.com/bptlab/fCM-design-support/wiki/Fragments#f11---label-notation-elements'
    },
    {
        title: 'F11.1: No empty states for data objects',
        id: 'F11.1',
        getViolations(mediator) {
            const fragmentModeler = mediator.fragmentModelerHook.modeler;
            const dataObjects = fragmentModeler.get('elementRegistry').filter(element => is(element, 'bpmn:DataObjectReference') && !(element.type === 'label')).map(element => element.businessObject);

            return dataObjects.filter(dataObject => !dataObject.states || dataObject.states.length === 0).map(dataObject => ({
                element: dataObject,
                message: 'Please provide at least one state for data object references.'
            }));
        },
        severity: SEVERITY.WARNING,
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
        severity : SEVERITY.INFORMATION,
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
                    message: 'Please use at least one start event in the fragment model.'
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
                    message: 'Your process has multiple start events. Please ensure that this is intended.'
                }));
            } else {
                return [];
            }
        },
        severity: SEVERITY.INFORMATION,
        link: 'https://github.com/bptlab/fCM-design-support/wiki/Fragments#f6---use-start-events-only-in-initial-fragments'
    },
    {
        title: 'F6C: Start fragment does not create case class',
        id: 'F6C',
        getViolations(mediator) {
            const dataModeler = mediator.dataModelerHook.modeler;
            const fragmentModeler = mediator.fragmentModelerHook.modeler;
            const startEvents = fragmentModeler.get('elementRegistry').filter(element => is(element, 'bpmn:StartEvent') && element.type !== 'label');
            const caseClasses = dataModeler.get('elementRegistry')
                .filter(element => is(element, 'od:Class'))
                .map(element => element.businessObject)
                .filter(clazz => clazz.caseClass);
            if (caseClasses.length === 0) {return [];}

            return startEvents.flatMap(startEvent => {
                const connectedElements = getConnectedElements(startEvent);

                // get according connected dataobjects
                const createdClasses = connectedElements.filter(element => is(element, 'bpmn:DataObjectReference')).map(element => element.businessObject.dataclass);
                const caseClassConnected = createdClasses.some(createdClass => caseClasses.includes(createdClass));

                if (!caseClassConnected) {
                    return [{
                        element: startEvent.businessObject,
                        message: 'Please make one of the nodes of this start fragment create an object of one of the case classes: ' + caseClasses.map(clazz => '"' + clazz.name + '"').join(', '),
                        quickFixes : caseClasses.flatMap(caseClass => connectedElements.filter(element => is(element, 'bpmn:Activity') || is(element, 'bpmn:StartEvent')).map(element => (
                            {
                                label : 'Add data object reference that writes case class "' + caseClass.name + '" to node "' + element.businessObject.name + '"',
                                action : (event) => fragmentModeler.startDoCreation(event, element, caseClass)
                            }
                        )))
                    }];
                } else {
                    return [];
                }
            });
        },
        severity: SEVERITY.ERROR,
        link: 'https://github.com/bptlab/fCM-design-support/wiki/Fragments#f6---use-start-events-only-in-initial-fragments'
    },    
    {
        title : 'Have each fragment state transition in olc',
        id : 'C3',
        getViolations(mediator) {
            const fragmentModeler = mediator.fragmentModelerHook.modeler;
            const activities = fragmentModeler.get('elementRegistry').filter(element => is(element, 'bpmn:Activity'));

            return activities.map(activity => activity.businessObject).flatMap(activity => {
                // TODO improve after introduction of IO-Sets
                const statesPerClass = {};
                activity.dataInputAssociations?.map(assoc => assoc.sourceRef[0]).filter(dataObjectReference => dataObjectReference.dataclass && dataObjectReference.states).forEach(dataObjectReference => {
                    if (!statesPerClass[dataObjectReference.dataclass.id]) {
                        statesPerClass[dataObjectReference.dataclass.id] = {incoming : [], outgoing : []};
                    }
                    statesPerClass[dataObjectReference.dataclass.id].incoming.push(...dataObjectReference.states);
                });
                activity.dataOutputAssociations?.map(assoc => assoc.targetRef).filter(dataObjectReference => dataObjectReference.dataclass && dataObjectReference.states).forEach(dataObjectReference => {
                    if (!statesPerClass[dataObjectReference.dataclass.id]) {
                        statesPerClass[dataObjectReference.dataclass.id] = {incoming : [], outgoing : []};
                    }
                    statesPerClass[dataObjectReference.dataclass.id].outgoing.push(...dataObjectReference.states);
                });
                const uncovered = Object.keys(statesPerClass).map(clazz => {
                    const transitionsInOlc = statesPerClass[clazz].incoming[0]?.$parent.get('Elements').filter(element => is(element, 'olc:Transition')) || [];
                    
                    function transitionsMatching (sourceState, targetState) {
                        return transitionsInOlc.filter(transition => transition.sourceState === sourceState && transition.targetState === targetState);
                    }

                    const uncoveredInputstates = statesPerClass[clazz].incoming.filter(sourceState => {
                        // Has target states of same class and none is covered
                        return statesPerClass[clazz].outgoing.length > 0 && statesPerClass[clazz].outgoing.filter(targetState => {
                            return sourceState === targetState || transitionsMatching(sourceState, targetState).length > 0;
                        }).length === 0;
                    });

                    const uncoveredOutputstates = statesPerClass[clazz].outgoing.filter(targetState => {
                        // Has source states of same class and none is covered
                        return statesPerClass[clazz].incoming.length > 0 && statesPerClass[clazz].incoming.filter(sourceState => {
                            return sourceState === targetState || transitionsMatching(sourceState, targetState).length > 0;
                        }).length === 0;
                    });
                    
                    return {
                        clazz,
                        uncoveredInputstates,
                        uncoveredOutputstates
                    }

                }).filter(({uncoveredInputstates, uncoveredOutputstates}) => (uncoveredInputstates.length + uncoveredOutputstates.length) > 0);

                function stringifyUncovered({uncoveredInputstates, uncoveredOutputstates}) {
                    return '' 
                        + (uncoveredInputstates.length > 0 && 'input state(s) ' + uncoveredInputstates.map(state => '"' + state.name + '"').join(', ') || '')
                        + (uncoveredInputstates.length > 0 && uncoveredOutputstates.length > 0 && ' and ' || '')
                        + (uncoveredOutputstates.length > 0 && 'output state(s) ' + uncoveredOutputstates.map(state => '"' + state.name + '"').join(', ') || '')
                        + ' of class "' + (uncoveredInputstates[0] || uncoveredOutputstates[0])?.$parent.name + '"';
                }

                function stringifyTransition(sourceState, targetState) {
                    return '\[' + sourceState.name + ' → ' + targetState.name + '\]';
                }

                function transitionToQuickFix(sourceState, targetState) {
                    return {
                        label : 'Create transition: ' + stringifyTransition(sourceState, targetState) + ' in OLC ' + sourceState.$parent.name,
                        action : () => mediator.olcModelerHook.modeler.createTransition(sourceState, targetState)
                    }
                }

                if (uncovered.length > 0) {
                    return [{
                        element : activity,
                        message : 'Please cover the ' + uncovered.map(stringifyUncovered).join(', ') + ' with valid transitions in the OLC.',
                        quickFixes : uncovered.flatMap(({clazz, uncoveredInputstates, uncoveredOutputstates}) => [
                            ... uncoveredInputstates.flatMap(sourceState => statesPerClass[clazz].outgoing.map(targetState => ({sourceState, targetState}))),
                            ... uncoveredOutputstates.flatMap(targetState => statesPerClass[clazz].incoming.filter(sourceState => !uncoveredInputstates.includes(sourceState)).map(sourceState => ({sourceState, targetState})))
                        ].map(({sourceState, targetState}) => transitionToQuickFix(sourceState, targetState)))
                    }];
                } else {
                    return [];
                }
            });
        },
        severity : SEVERITY.ERROR,
        link : 'https://github.com/bptlab/fCM-design-support/wiki/Consistency#c3---use-state-labels-and-state-transitions-of-data-objects-consistently-in-olcs-and-fragments'
    },
    {
        title: 'C5: Provide existential objects',
        id: 'C5',
        getViolations(mediator) {
            const classDependencies = getClassDependencies(mediator);

            const fragmentModeler = mediator.fragmentModelerHook.modeler;
            const activities = fragmentModeler.get('elementRegistry').filter(element => is(element, 'bpmn:Activity')).map(activity => activity.businessObject);

            return activities.flatMap(activity => {
                // TODO rework when IO sets are implemented (classes might be created in specific io configurations)
                const writtenClasses = new Set(activity.dataOutputAssociations?.filter(assoc => assoc.targetRef.dataclass).map(assoc => assoc.targetRef.dataclass));
                const readClasses = new Set(activity.dataInputAssociations?.map(assoc => assoc.sourceRef[0].dataclass));
                const createdClasses = [...writtenClasses].filter(clazz => !readClasses.has(clazz));
                
                const missingAssociations = createdClasses.flatMap(createdClass => {
                    return (classDependencies[createdClass.id] || []).filter(contextClass => !writtenClasses.has(contextClass) && !readClasses.has(contextClass)).map(contextClass => ({createdClass, contextClass}));
                });

                function stringifyMissing({createdClass, contextClass}) {
                    return 'to \"' + contextClass.name + '\" for \"' + createdClass.name + '\"';
                }

                if (missingAssociations.length > 0) {
                    const activityShape = fragmentModeler.get('elementRegistry').get(activity.id);
                    return [{
                        element: activity,
                        // Maybe we can also add to the error message, which classes are missing their context class?
                        message: 'In activity "' + activity.name + '", please add references to the following context classes: ' + missingAssociations.map(stringifyMissing).join(', '),
                        quickFixes : missingAssociations.flatMap(({contextClass}) => (
                            [{
                                label : 'Add reading data object reference of class \"' + contextClass.name + '\" to activity \"' + activity.name + '\"',
                                action : (event) => fragmentModeler.startDoCreation(event, activityShape, contextClass, true)
                            },{
                                label : 'Add writing data object reference of class \"' + contextClass.name + '\" to activity \"' + activity.name + '\"',
                                action : (event) => fragmentModeler.startDoCreation(event, activityShape, contextClass)
                            }]
                        ))
                    }];
                } else {
                    return [];
                }
            });
        },
        severity: SEVERITY.ERROR,
        link: 'https://github.com/bptlab/fCM-design-support/wiki/Consistency#c5---provide-context-data-objects-from-data-model-on-data-object-creation-in-fragments'
    },
    {
        title : 'Specify a Case Class.',
        id : 'D2',
        getViolations(mediator) {
            const hook = mediator.dataModelerHook;
            const dataModeler = hook.modeler;
            const clazzes = dataModeler.get('elementRegistry').getAll().filter(element => is(element, 'od:Class'));
            
            const caseClasses = dataModeler.get('elementRegistry')
                .filter(element => is(element, 'od:Class'))
                .map(element => element.businessObject)
                .filter(clazz => clazz.caseClass);
            
            if (!caseClasses.length) {
                return [{
                    element : hook.getRootObject(),
                    message : 'Please specify a case class.',
                    quickFixes : clazzes.map(clazz => (
                            {
                                label : 'Make class "' + clazz.businessObject.name + '" a case class',
                                action : (action) => dataModeler.updateProperty(clazz, {caseClass: true})
                            }
                    ))
                }];
            } else {
                return [];
            }
        },
        severity : SEVERITY.ERROR,
        link : 'https://github.com/bptlab/fCM-design-support/wiki/Data-Model#d2---specify-a-case-class'
    },
    {
        title : 'Connect the Case Class to Every Other Class.',
        id : 'D3',
        getViolations(mediator) {
            const dataModeler = mediator.dataModelerHook.modeler;
            const classDependents = getClassDependents(mediator);
            const clazzes = dataModeler.get('elementRegistry')
                .filter(element => is(element, 'od:Class'))
                .map(element => element.businessObject);
            
            const caseClasses = clazzes.filter(clazz => clazz.caseClass);

            if (!caseClasses.length) {
                return [];
            }
            
            const connectedWithCaseClass = getConnectedByExistentialAssociation(caseClasses[0], classDependents);
            const notConnectedClasses = clazzes.filter(clazz => connectedWithCaseClass.indexOf(clazz) === -1);

            return notConnectedClasses.map(clazz => ({
                element: clazz,
                message: 'Please connect class "' + clazz.name + '" to the case class via a path of existential associations.'
            }
            ))

        },
        severity : SEVERITY.ERROR,
        link : 'https://github.com/bptlab/fCM-design-support/wiki/Data-Model#d3---connect-the-case-class-to-every-other-class'
    },
]