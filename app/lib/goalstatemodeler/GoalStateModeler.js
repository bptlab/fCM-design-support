import $ from 'jquery';
import { without } from 'min-dash';

var dummyStateList = [
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
]

export default function GoalStateModeler(container) {
    var root = document.createElement('div');
    root.classList.add('gs-root');
    $(container).get(0).appendChild(root);
    this._root = root;
}

GoalStateModeler.prototype.showGoalStatement = function (goalStatement) {
    this.clear();
    this._goalStatement = goalStatement;
    if (!goalStatement) return;
    this._handlers = {
        'disjunction': this.createDisjunctionElement,
        'conjunction': this.createConjunctionElement,
        'literal': this.createLiteralElement
    }
    this.handleStatement(this._root, goalStatement);
}

GoalStateModeler.prototype.handleStatement = function (parentElement, statement) {
    var element = this._handlers[statement.type || 'literal'].call(this, parentElement, statement);
    statement.element = element;
    element.statement = statement;
    return element;
}

GoalStateModeler.prototype.createDisjunctionElement = function (parentElement, disjunction) {
    var element = this.createOperationElement(parentElement, disjunction);
    var addConjunctionButton = document.createElement('button');
    addConjunctionButton.innerHTML = '+';
    addConjunctionButton.addEventListener('click', event => {
        var newConjunction = { type: 'conjunction', operands: [] };
        disjunction.operands.push(newConjunction);
        element.addOperand(newConjunction);
    });
    element.appendChild(addConjunctionButton);
    return element;
}

GoalStateModeler.prototype.createConjunctionElement = function (parentElement, conjunction) {
    var element = this.createOperationElement(parentElement, conjunction);
    var addLiteralButton = document.createElement('button');
    addLiteralButton.innerHTML = '*';
    addLiteralButton.addEventListener('click', event => {
        var newLiteral = { type: 'literal', class: this.getClassList()[0], states: [] };
        conjunction.operands.push(newLiteral);
        element.addOperand(newLiteral);
    });
    element.appendChild(addLiteralButton);
    return element;
}

GoalStateModeler.prototype.createOperationElement = function (parentElement, operation) {
    var element = document.createElement('div');
    element.classList.add('gs-operation');
    element.classList.add('gs-' + operation.type);

    var operandsElement = document.createElement('div');
    operandsElement.classList.add('gs-operands');
    element.appendChild(operandsElement);
    element.operandsElement = operandsElement;

    element.addOperand = (operand) => {
        var operandElement = this.handleStatement(operandsElement, operand);
        operandElement.classList.add('operand');

        var deleteButton = document.createElement('button');
        deleteButton.innerHTML = 'x';
        deleteButton.addEventListener('click', event => {
            this.deleteStatement(operation, operand);
        });
        operandElement.appendChild(deleteButton);
    }
    operation.operands.forEach(element.addOperand);
    parentElement.appendChild(element);
    return element;
}

GoalStateModeler.prototype.createLiteralElement = function (parentElement, literal) {
    var element = document.createElement('div');
    element.classList.add('gs-literal');
    var classElement = makeDiv('', 'gs-dataclass');
    element.appendChild(classElement);
    element.classElement = classElement;
    var stateElement = makeDiv('', 'gs-datastate');
    element.appendChild(stateElement);
    element.stateElement = stateElement;
    parentElement.append(element);

    var classDropDownMenu = document.createElement('div');
    classDropDownMenu.classList.add('gs-dropdown-menu');
    classElement.dropdown = classDropDownMenu;

    var stateDropDownMenu = document.createElement('div');
    stateDropDownMenu.classList.add('gs-dropdown-menu');
    stateElement.dropdown = stateDropDownMenu;

    this.populateLiteral(literal, element);

    return element;
}

GoalStateModeler.prototype.populateLiteral = function (literal, element) {
    var { classElement, stateElement } = element;

    classElement.innerText = literal.class.name;
    classElement.dropdown.innerHTML = '';
    classElement.addEventListener('mouseenter', event => {
        classElement.dropdown.innerHTML = '';
        for (var clazz of this.getClassList()) {
            if (clazz === literal.class) continue;
            var entry = document.createElement('div');
            const innerClass = clazz;
            entry.classList.add('gs-dropdown-entry');
            entry.innerHTML = clazz.name;
            entry.addEventListener('click', event => {
                this.changeClass(innerClass, literal);
            });
            classElement.dropdown.appendChild(entry);
        }
        classElement.dropdown.style.display = 'block';
    });
    classElement.addEventListener('mouseleave', event => {
        classElement.dropdown.innerHTML = '';
        classElement.dropdown.style.display = 'none';
    });
    classElement.appendChild(classElement.dropdown);

    stateElement.innerText = '[' + (literal.states.length > 0 ? literal.states.map(state => state.name).join('|') : '<empty>') + ']';
    stateElement.dropdown.innerHTML = '';
    stateElement.addEventListener('mouseenter', event => {
        stateElement.dropdown.innerHTML = '';
        for (var state of this.getStateList(literal.class)) {
            var entry = document.createElement('div');
            const innerState = state;
            entry.classList.add('gs-dropdown-entry');
            if (literal.states.includes(state)) {
                entry.classList.add('gs-dropdown-entry-selected');
            }
            entry.innerHTML = state.name;
            entry.addEventListener('click', event => {
                this.toggleState(innerState, literal);
            });
            stateElement.dropdown.appendChild(entry);
        }
        stateElement.dropdown.style.display = 'block';
    });
    stateElement.addEventListener('mouseleave', event => {
        stateElement.dropdown.innerHTML = '';
        stateElement.dropdown.style.display = 'none';
    });
    stateElement.appendChild(stateElement.dropdown);
}

GoalStateModeler.prototype.clear = function () {
    var root = this._root;
    while (root.firstChild) root.removeChild(root.lastChild);
}

GoalStateModeler.prototype.changeClass = function (clazz, literal) {
    if (literal.class !== clazz) {
        literal.class = clazz;
        literal.states = [];
        this.populateLiteral(literal, literal.element);
    }
}

GoalStateModeler.prototype.toggleState = function (state, literal) {
    if (literal.states.includes(state)) {
        literal.states = without(literal.states, state);
    } else {
        literal.states.push(state);
    }
    console.log(literal.states);
    this.populateLiteral(literal, literal.element);
}

GoalStateModeler.prototype.deleteStatement = function (parentStatement, statement) {
    var element = statement.element;
    var parentElement = parentStatement.element;
    parentStatement.operands = without(parentStatement.operands, statement);
    parentElement.operandsElement.removeChild(element);
}

GoalStateModeler.prototype.handleStatesChanged = function (clazz, newStates) {
    //TODO
}

GoalStateModeler.prototype.handleClassesChanged = function (classes) {
    //TODO
}

GoalStateModeler.prototype.getClassList = function () {
    return dummyStateList;
}

GoalStateModeler.prototype.getStateList = function (clazz) {
    return clazz.states;
}


function makeDiv(text, ...classes) {
    var element = document.createElement('div');
    element.innerHTML = text;
    classes.forEach(clazz => element.classList.add(clazz));
    return element;
}

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