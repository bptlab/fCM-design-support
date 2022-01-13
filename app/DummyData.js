import { is } from "./lib/datamodelmodeler/util/ModelUtil";

export var dummyStateList = [
    {
        id: 'Class1_Paper',
        states: [
            { id: 'State1', name: 'In Review' },
            { id: 'State2', name: 'Accepted' },
            { id: 'State3', name: 'Rejected' }
        ]
    },

    {
        id: 'Class2_Conference',
        states: [
            { id: 'State4', name: 'In Planning' },
            { id: 'State5', name: 'Planned' },
            { id: 'State6', name: 'Canceled' }
        ]
    },

    {
        id: 'Class3_Decision',
        states: [
            { id: 'State7', name: 'Scheduled' },
            { id: 'State8', name: 'Done' }
        ]
    },

    {
        id: 'Class4_Unicorn',
        states: [
            { id: 'State9', name: 'Vanished' },
            { id: 'State10', name: 'Found' }
        ]
    }
];

export function dummyGoalState(olcs){
    function toReferences(literal) {
        var clazz = olcs.filter(clazz => clazz.id === literal.classId)[0];
        var states = literal.stateIds.map(stateId => clazz.get('Elements').filter(element => is(element, 'olc:State')).filter(state => state.id === stateId)[0]);
        return {
            type: literal.type,
            class: clazz,
            states: states
        };
    }
    return {
        type: 'disjunction',
        operands: [
            {
                type: 'conjunction',
                operands: [
                    toReferences({ type: 'literal', classId: 'Class1_Paper', stateIds: ['State2', 'State3'] }),
                    toReferences({ type: 'literal', classId: 'Class2_Conference', stateIds: ['State5'] }),
                    toReferences({ type: 'literal', classId: 'Class3_Decision', stateIds: ['State8'] })
                ]
            },
            {
                type: 'conjunction',
                operands: [
                    toReferences({ type: 'literal', classId: 'Class1_Paper', stateIds: ['State2', 'State3'] }),
                    toReferences({ type: 'literal', classId: 'Class2_Conference', stateIds: ['State6'] }),
                    toReferences({ type: 'literal', classId: 'Class3_Decision', stateIds: ['State8'] })
                ]
            },
            {
                type: 'conjunction',
                operands: [
                    toReferences({ type: 'literal', classId: 'Class4_Unicorn', stateIds: ['State10'] })
                ]
            },
        ]
    }
}

export default {
    dummyStateList,
    dummyGoalState
}