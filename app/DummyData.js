export var dummyStateList = [
    {
        id: 'Class1',
        name: 'Paper',
        states: [
            { id: 'State1', name: 'In Review' },
            { id: 'State2', name: 'Accepted' },
            { id: 'State3', name: 'Rejected' }
        ]
    },

    {
        id: 'Class2',
        name: 'Conference',
        states: [
            { id: 'State4', name: 'In Planning' },
            { id: 'State5', name: 'Planned' },
            { id: 'State6', name: 'Canceled' }
        ]
    },

    {
        id: 'Class3',
        name: 'Decision',
        states: [
            { id: 'State7', name: 'Scheduled' },
            { id: 'State8', name: 'Done' }
        ]
    },

    {
        id: 'Class4',
        name: 'Unicorn',
        states: [
            { id: 'State9', name: 'Vanished' },
            { id: 'State10', name: 'Found' }
        ]
    }
];

function toReferences(literal) {
    var clazz = dummyStateList.filter(clazz => clazz.id === literal.classId)[0];
    var states = literal.stateIds.map(stateId => clazz.states.filter(state => state.id === stateId)[0]);
    return {
        type: literal.type,
        class: clazz,
        states: states
    };
}

export var dummyGoalState = {
    type: 'disjunction',
    operands: [
        {
            type: 'conjunction',
            operands: [
                toReferences({ type: 'literal', classId: 'Class1', stateIds: ['State2', 'State3'] }),
                toReferences({ type: 'literal', classId: 'Class2', stateIds: ['State5'] }),
                toReferences({ type: 'literal', classId: 'Class3', stateIds: ['State8'] })
            ]
        },
        {
            type: 'conjunction',
            operands: [
                toReferences({ type: 'literal', classId: 'Class1', stateIds: ['State2', 'State3'] }),
                toReferences({ type: 'literal', classId: 'Class2', stateIds: ['State6'] }),
                toReferences({ type: 'literal', classId: 'Class3', stateIds: ['State8'] })
            ]
        },
        {
            type: 'conjunction',
            operands: [
                toReferences({ type: 'literal', classId: 'Class4', stateIds: ['State10'] })
            ]
        },
    ]
}

export default {
    dummyStateList,
    dummyGoalState
}