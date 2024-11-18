import $ from 'jquery';
import {without} from 'min-dash';
import {formatStates, is, type} from '../util/Util';
import getDropdown from '../util/Dropdown';
import EventBus from 'diagram-js/lib/core/EventBus'
import TerminationConditionEvents from './TerminationConditionEvents';
import TerminationConditionModdle from './TerminationConditionModdle';
import CommonEvents from '../common/CommonEvents';

const NAMESPACE = 'tc';

export default function TerminationConditionModeler(container) {
    container = $(container).get(0);
    var root = document.createElement('div');
    root.classList.add('tc-root');
    container.appendChild(root);
    this._root = root;
    this.eventBus = new EventBus();
    this.moddle = new TerminationConditionModdle();

    this._propagateEvent = event => {
        this.eventBus.fire('element.' + event.type, {originalEvent: event, element: {}});
    }
    container.addEventListener('click', this._propagateEvent, true);
    container.addEventListener('mouseup', this._propagateEvent, true);
    container.addEventListener('mousedown', this._propagateEvent, true);
}

TerminationConditionModeler.prototype.id = "TC";
TerminationConditionModeler.prototype.rank = 8;

TerminationConditionModeler.prototype.name = function (constructionMode) {
    if (constructionMode) {
        return "Termination Condition";
    } else {
        return "Termination Condition";
    }
};

TerminationConditionModeler.prototype.showTerminationCondition = function (terminationCondition) {
    this.clear();
    this._terminationCondition = terminationCondition;
    if (!terminationCondition) return;
    this._handlers = {
        'tc:Disjunction': this.createDisjunctionElement,
        'tc:Conjunction': this.createConjunctionElement,
        'tc:Literal': this.createLiteralElement
    }
    this.handleStatement(this._root, terminationCondition);
}

TerminationConditionModeler.prototype.handleStatement = function (parentElement, statement) {
    var element = this._handlers[statement.$type].call(this, parentElement, statement);
    statement.element = element;
    element.statement = statement;
    return element;
}

TerminationConditionModeler.prototype.createDisjunctionElement = function (parentElement, disjunction) {
    var element = this.createOperationElement(parentElement, disjunction);
    var addConjunctionButton = document.createElement('button');
    addConjunctionButton.innerHTML = '+';
    addConjunctionButton.addEventListener('click', event => {
        var newConjunction = this.moddle.create('tc:Conjunction', {operands: []});
        disjunction.operands.push(newConjunction);
        element.addOperand(newConjunction);
        this.addLiteral(newConjunction);
    });
    element.appendChild(addConjunctionButton);
    return element;
}

TerminationConditionModeler.prototype.createConjunctionElement = function (parentElement, conjunction) {
    var element = this.createOperationElement(parentElement, conjunction);
    var addLiteralButton = document.createElement('button');
    addLiteralButton.innerHTML = '+';
    addLiteralButton.addEventListener('click', event => this.addLiteral(conjunction));
    element.appendChild(addLiteralButton);
    return element;
}

TerminationConditionModeler.prototype.addLiteral = function (parentStatement) {
    var newLiteral = this.moddle.create('tc:Literal', {class: this.getClassList()[0], states: []});
    parentStatement.operands.push(newLiteral);
    parentStatement.element.addOperand(newLiteral);
}

TerminationConditionModeler.prototype.createOperationElement = function (parentElement, operation) {
    operation.get('operands');
    var element = document.createElement('div');
    element.classList.add('tc-operation');
    element.classList.add('tc-' + type(operation).toLowerCase());

    var operandsElement = document.createElement('div');
    operandsElement.classList.add('tc-operands');
    element.appendChild(operandsElement);
    element.operandsElement = operandsElement;

    element.addOperand = (operand) => {
        operand.$parent = operation;
        var operandElement = this.handleStatement(operandsElement, operand);
        operandElement.classList.add('operand');

        var deleteButton = document.createElement('button');
        deleteButton.innerHTML = 'x';
        deleteButton.addEventListener('click', event => {
            this.deleteStatement(operand);
        });
        operandElement.appendChild(deleteButton);
        this.eventBus.fire(TerminationConditionEvents.TERMINATIONCONDITION_CHANGED, {});
    }
    operation.operands.forEach(element.addOperand);
    parentElement.appendChild(element);
    return element;
}

TerminationConditionModeler.prototype.createLiteralElement = function (parentElement, literal) {
    var element = document.createElement('div');
    element.classList.add('tc-literal');
    var classElement = makeDiv('', 'tc-dataclass');
    element.appendChild(classElement);
    element.classElement = classElement;
    var stateElement = makeDiv('', 'tc-datastate');
    element.appendChild(stateElement);
    element.stateElement = stateElement;
    parentElement.append(element);

    classElement.dropdown = getDropdown();
    classElement.dropdown.classList.remove("dd-dropdown-menu");
    classElement.dropdown.classList.add("dd-dropdown-menu-termination-condition");
    stateElement.dropdown = getDropdown();
    stateElement.dropdown.classList.remove("dd-dropdown-menu");
    stateElement.dropdown.classList.add("dd-dropdown-menu-termination-condition");

    this.populateLiteral(literal, element);

    return element;
}

TerminationConditionModeler.prototype.populateLiteral = function (literal, element) {
    var {classElement, stateElement} = element;

    classElement.innerText = literal.class.name;
    classElement.dropdown.innerHTML = '';
    classElement.addEventListener('mouseenter', event => {
        classElement.dropdown.populate(
            without(this.getClassList(), literal.class),
            (clazz, element) => this.changeClass(clazz, literal)
        );
        classElement.dropdown.addCreateElementInput(event => {
            const clazz = this.eventBus.fire(CommonEvents.DATACLASS_CREATION_REQUESTED, {
                name: classElement.dropdown.getInputValue().trim()
            });
            const olc = this.getClassList().filter(olc => olc.classRef === clazz)[0];
            this.changeClass(olc, literal);
        });
        classElement.dropdown.style.display = 'block';
    });
    classElement.addEventListener('mouseleave', event => {
        classElement.dropdown.innerHTML = '';
        classElement.dropdown.style.display = 'none';
    });
    classElement.appendChild(classElement.dropdown);

    stateElement.innerText = formatStates(literal.states);
    stateElement.dropdown.innerHTML = '';
    const openStateDropdown = (event) => {
        const updateStateSelection = () => {
            stateElement.dropdown.getEntries().forEach(entry => entry.setSelected(literal.states.includes(entry.option)));
        }
        stateElement.dropdown.populate(
            this.getStateList(literal.class),
            (state, element) => {
                this.toggleState(state, literal);
                updateStateSelection();
            }
        );
        stateElement.dropdown.addCreateElementInput(event => {
            const state = this.eventBus.fire(CommonEvents.STATE_CREATION_REQUESTED, {
                name: stateElement.dropdown.getInputValue().trim(),
                olc: literal.class
            });
            this.toggleState(state, literal);
            openStateDropdown(event);
        });
        updateStateSelection();
        stateElement.dropdown.style.display = 'block';
        stateElement.dropdown.focusInput();
    }
    stateElement.addEventListener('mouseenter', event => openStateDropdown(event));
    stateElement.addEventListener('mouseleave', event => {
        stateElement.dropdown.innerHTML = '';
        stateElement.dropdown.style.display = 'none';
    });
    stateElement.appendChild(stateElement.dropdown);
}

TerminationConditionModeler.prototype.clear = function () {
    var root = this._root;
    while (root.firstChild) root.removeChild(root.lastChild);
}

TerminationConditionModeler.prototype.changeClass = function (clazz, literal) {
    if (literal.class !== clazz) {
        literal.class = clazz;
        literal.states = [];
        this.populateLiteral(literal, literal.element);
    }
}

TerminationConditionModeler.prototype.toggleState = function (state, literal) {
    if (literal.states.includes(state)) {
        literal.states = without(literal.states, state);
    } else {
        literal.states.push(state);
    }
    this.populateLiteral(literal, literal.element);
}

TerminationConditionModeler.prototype.deleteStatement = function (statement) {
    var element = statement.element;
    var parentStatement = statement.$parent;
    var parentElement = parentStatement.element;
    parentStatement.operands = without(parentStatement.operands, statement);
    parentElement.operandsElement.removeChild(element);
    this.eventBus.fire(TerminationConditionEvents.TERMINATIONCONDITION_CHANGED, {});
    if (parentStatement.operands.length === 0 && parentStatement.$parent) {
        this.deleteStatement(parentStatement);
    }
}

TerminationConditionModeler.prototype.handleStatesChanged = function (clazz, newStates) {
    //TODO
}

TerminationConditionModeler.prototype.handleOlcListChanged = function (classes) {
    this._classList = classes;
    if (classes.length === 0) {
        this._root.classList.add('no-dataclass');
    } else {
        this._root.classList.remove('no-dataclass');
    }
    if (this._terminationCondition) {
        var literalsToDelete = [];
        this.forEachLiteral(literal => {
            if (!classes.includes(literal.class)) {
                literalsToDelete.push(literal);
            } else {
                this.populateLiteral(literal, literal.element);
            }
        });
        literalsToDelete.forEach(literal => this.deleteStatement(literal));
        return {literalsToDelete};
    } else {
        return {literalsToDelete: []};
    }
}

TerminationConditionModeler.prototype.getLiteralsWithClassId = function (id) {
    var literalsOfClass = [];
    this.forEachLiteral(literal => {
        if (literal.class.id === id) {
            literalsOfClass.push(literal);
        }
    });
    return literalsOfClass;
}

TerminationConditionModeler.prototype.getLiteralsWithState = function (state) {
    const literalsWithState = [];
    this.forEachLiteral(literal => {
        if (literal.states.includes(state)) {
            literalsWithState.push(literal);
        }
    });
    return literalsWithState;
}

TerminationConditionModeler.prototype.handleStateRenamed = function (state) {
    this.forEachLiteral(literal => {
        if (literal.states.includes(state)) {
            this.populateLiteral(literal, literal.element);
        }
    });
}

TerminationConditionModeler.prototype.handleStateDeleted = function (state) {
    this.forEachLiteral(literal => {
        if (literal.states.includes(state)) {
            literal.states = without(literal.states, state);
            this.populateLiteral(literal, literal.element);
        }
    });
}

TerminationConditionModeler.prototype.getLiterals = function () {
    //TODO refactor to use getStatements
    if (!this._terminationCondition) return undefined;
    const statementsToVisit = [this._terminationCondition];
    const visitedLiterals = [];
    while (statementsToVisit.length > 0) {
        var nextStatement = statementsToVisit.shift();
        if (is(nextStatement, 'tc:Literal')) {
            visitedLiterals.push(nextStatement);
        } else {
            statementsToVisit.push(...nextStatement.operands);
        }
    }
    return visitedLiterals;
}

TerminationConditionModeler.prototype.getStatements = function () {
    if (!this._terminationCondition) return undefined;
    const statementsToVisit = [this._terminationCondition];
    const visitedStatements = [];
    while (statementsToVisit.length > 0) {
        var nextStatement = statementsToVisit.shift();
        visitedStatements.push(nextStatement);
        if (is(nextStatement, 'tc:Operation')) {
            statementsToVisit.push(...nextStatement.operands);
        }
    }
    return visitedStatements;
}

TerminationConditionModeler.prototype.forEachLiteral = function (consumer) {
    return this.getLiterals().forEach(consumer);
}

TerminationConditionModeler.prototype.getClassList = function () {
    return this._classList || [];
}

TerminationConditionModeler.prototype.getStateList = function (clazz) {
    return clazz.get('Elements').filter(element => is(element, 'olc:State'));
}

TerminationConditionModeler.prototype.getTerminationCondition = function () {
    return this._terminationCondition;
}

TerminationConditionModeler.prototype.createNew = function () {
    this.showTerminationCondition(this.moddle.create(
        'tc:Disjunction',
        {operands: []}
    ));
}

TerminationConditionModeler.prototype.saveXML = function (options = {}) {
    return new Promise((resolve, reject) => {
        this.moddle.toXML(this._terminationCondition, options).then(function (result) {
            return resolve({xml: result.xml});
        }).catch(function (err) {
            return reject(err);
        });
    });
};

TerminationConditionModeler.prototype.importXML = function (xml) {
    return new Promise((resolve, reject) => {
        this.moddle.fromXML(xml).then((result) => {
            this.eventBus.fire('import.parse.complete', result);
            this.showTerminationCondition(result.rootElement);
            resolve();
        }).catch(function (err) {
            return reject(err);
        });

    });
};


function makeDiv(text, ...classes) {
    var element = document.createElement('div');
    element.innerHTML = text;
    classes.forEach(clazz => element.classList.add(clazz));
    return element;
}