
import { is } from '../datamodelmodeler/util/ModelUtil';

export default [
    {
        getViolatingElements : function(mediator) {
            var olc = mediator.olcModelerHook.modeler.getCurrentOlc();
            var states = olc.get('Elements').filter(element => is(element, 'olc:State'));
            return states.filter(state => true).map(state => ({
                element : mediator.olcModelerHook.modeler.get('elementRegistry').get(state.id),
                message : 'Foobar'
            }));
        }
    }
]