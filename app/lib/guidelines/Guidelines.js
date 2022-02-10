import { is } from '../datamodelmodeler/util/ModelUtil';

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
        title: 'F9: Do not use gateways at the beginning of a fragment',
        id: 'F9',
        getViolations(mediator) {
            const gateways = mediator.fragmentModelerHook.modeler.get('elementRegistry').filter(element => is(element, 'bpmn:Gateway'));
            gateways.filter(gateway => gateway.incoming.length === 0);
            return gateways.filter(gateway => gateway.incoming.length === 0).map(gateway => ({
                element: gateway,
                message: 'Gateways should not be used at the beginning of a fragment'
            }));
        },
        severity: SEVERITY.ERROR,
        link: 'https://github.com/bptlab/fCM-design-support/wiki/Fragments#f9---do-not-use-gateways-at-the-beginning-of-a-fragment'
    }
]
