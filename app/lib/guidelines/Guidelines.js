
import { is } from '../datamodelmodeler/util/ModelUtil';

export var SEVERITY = {
    ERROR : {
        cssClass : 'errorElement'
    },
    WARNING : {
        cssClass : 'warningElement'
    }
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
            }));
        },
        severity : SEVERITY.WARNING,
        link : 'https://de.wikipedia.org/wiki/Käsekuchen'
    }
]