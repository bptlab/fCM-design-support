
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

export default [
    {
        title : 'Development Guideline',
        id : 'eins',
        getViolations(mediator) {
            var olc = mediator.olcModelerHook.modeler.getCurrentOlc();
            var states = olc.get('Elements').filter(element => is(element, 'olc:State'));
            return states.filter(state => !state.name?.endsWith('cake')).map(state => ({
                element : mediator.olcModelerHook.modeler.get('elementRegistry').get(state.id),
                message : 'Please make state ' + state.name + ' a cake.',
                gfx : mediator.olcModelerHook.modeler.get('elementRegistry').getGraphics(state.id),
                hook: mediator.olcModelerHook,
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
            var olc = olcModeler.getCurrentOlc();
            var states = olc.get('Elements').filter(element => is(element, 'olc:State'));
            return states.filter(state => state.name !== 'Cheesecake').map(state => ({
                element : olcModeler.get('elementRegistry').get(state.id),
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
                ],
                gfx : olcModeler.get('elementRegistry').getGraphics(state.id),
                hook: mediator.olcModelerHook,
            }));
        },
        severity : SEVERITY.WARNING,
        link : 'https://de.wikipedia.org/wiki/Käsekuchen'
    },
    {
        title : 'O4: Define meaningful state lables',
        id : 'O4',
        getViolations(mediator) {
            var olc = mediator.olcModelerHook.modeler.getCurrentOlc();
            var states = olc.get('Elements').filter(element => is(element, 'olc:State'));
            var ex = new RegExp("(ed$|ready|initial)");
            return states.filter(state => !state.name.match(ex)).map(state => ({
                element : mediator.olcModelerHook.modeler.get('elementRegistry').get(state.id),
                message : 'State "' + state.name + '" has no meaningful state label. Consider changing it to past tense',
                gfx : mediator.olcModelerHook.modeler.get('elementRegistry').getGraphics(state.id),
                hook: mediator.olcModelerHook,
            }));
        },
        severity : SEVERITY.WARNING,
        link : 'https://github.com/bptlab/fCM-design-support/wiki/Object-Lifecycle-(OLC)#o4---define-meaningful-state-labels'
    },
    {
        title : 'GS2: Include all relevant data objects in the goal',
        id : 'GS2',
        getViolations(mediator) {
            var goalstate_operands = mediator.goalStateModelerHook.modeler.getGoalState().operands;
            console.log(mediator.goalStateModelerHook.modeler.getGoalState());
            console.log(!goalstate_operands.length);
            return goalstate_operands.filter(state => !goalstate_operands.length).map(state => ({
                element : mediator.goalStateModelerHook.modeler.getGoalState(),
                message : 'Your goalstate should include all relevant data objects, but at least one.',
                gfx : mediator.goalStateModelerHook.modeler.getGoalState(),
                hook: mediator.goalStateModelerHook,
            }));
        },
        severity : SEVERITY.WARNING,
        link : 'https://github.com/bptlab/fCM-design-support/wiki/Goal-State#gs2---include-all-relevant-data-objects-in-the-goal-state'
    },
]