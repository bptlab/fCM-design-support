import $ from 'jquery';
import { without } from 'min-dash';
import { formatStates, type, is } from '../util/Util';
import getDropdown from '../util/Dropdown';
import EventBus from 'diagram-js/lib/core/EventBus'
import GoalStateEvents from './GoalStateEvents';
import GoalStateModdle from './GoalStateModdle';
import CommonEvents from '../common/CommonEvents';

const NAMESPACE = 'gs';

export default function GoalStateModeler(container) {
    container = $(container).get(0);
    var root = document.createElement('div');
    root.classList.add('gs-root');
    container.appendChild(root);
    this._root = root;
    this.eventBus = new EventBus();
    this.moddle = new GoalStateModdle();

    this._propagateEvent = event => {
        this.eventBus.fire('element.' + event.type, { originalEvent : event, element : {} });
    }
    container.addEventListener('click', this._propagateEvent, true);
    container.addEventListener('mouseup', this._propagateEvent, true);
    container.addEventListener('mousedown', this._propagateEvent, true);
}

GoalStateModeler.prototype.showGoalState = function (goalState) {
    this.clear();
    this._goalState = goalState;
    if (!goalState) return;
    this._handlers = {
        'gs:Disjunction': this.createDisjunctionElement,
        'gs:Conjunction': this.createConjunctionElement,
        'gs:Literal': this.createLiteralElement
    }
    this.handleStatement(this._root, goalState);
}

GoalStateModeler.prototype.handleStatement = function (parentElement, statement) {
    var element = this._handlers[statement.$type].call(this, parentElement, statement);
    statement.element = element;
    element.statement = statement;
    return element;
}

GoalStateModeler.prototype.createDisjunctionElement = function (parentElement, disjunction) {
    var element = this.createOperationElement(parentElement, disjunction);
    var addConjunctionButton = document.createElement('button');
    addConjunctionButton.innerHTML = '+';
    addConjunctionButton.addEventListener('click', event => {
        var newConjunction = this.moddle.create('gs:Conjunction', {operands: [] });
        disjunction.operands.push(newConjunction);
        element.addOperand(newConjunction);
        this.addLiteral(newConjunction);
    });
    element.appendChild(addConjunctionButton);
    return element;
}

GoalStateModeler.prototype.createConjunctionElement = function (parentElement, conjunction) {
    var element = this.createOperationElement(parentElement, conjunction);
    var addLiteralButton = document.createElement('button');
    addLiteralButton.innerHTML = '+';
    addLiteralButton.addEventListener('click', event => this.addLiteral(conjunction));
    element.appendChild(addLiteralButton);
    return element;
}

GoalStateModeler.prototype.addLiteral = function (parentStatement) {
    var newLiteral = this.moddle.create('gs:Literal', {class: this.getClassList()[0], states: [] });
    parentStatement.operands.push(newLiteral);
    parentStatement.element.addOperand(newLiteral);
}

GoalStateModeler.prototype.createOperationElement = function (parentElement, operation) {
    operation.get('operands');
    var element = document.createElement('div');
    element.classList.add('gs-operation');
    element.classList.add('gs-' + type(operation).toLowerCase());

    var operandsElement = document.createElement('div');
    operandsElement.classList.add('gs-operands');
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
        this.eventBus.fire(GoalStateEvents.GOALSTATE_CHANGED, {});
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

    classElement.dropdown = getDropdown();
    stateElement.dropdown = getDropdown();

    this.populateLiteral(literal, element);

    return element;
}

GoalStateModeler.prototype.populateLiteral = function (literal, element) {
    var { classElement, stateElement } = element;

    classElement.innerText = literal.class.name;
    classElement.dropdown.innerHTML = '';
    classElement.addEventListener('mouseenter', event => {
        classElement.dropdown.populate(
            without(this.getClassList(), literal.class),
            (clazz, element) => this.changeClass(clazz, literal)
        );
        classElement.dropdown.addCreateElementInput(event => {
            const clazz = this.eventBus.fire(CommonEvents.DATACLASS_CREATION_REQUESTED, {
                name: classElement.dropdown.getInputValue()
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
                name: stateElement.dropdown.getInputValue(),
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
    this.populateLiteral(literal, literal.element);
}

GoalStateModeler.prototype.deleteStatement = function (statement) {
    var element = statement.element;
    var parentStatement = statement.$parent;
    var parentElement = parentStatement.element;
    parentStatement.operands = without(parentStatement.operands, statement);
    parentElement.operandsElement.removeChild(element);
    this.eventBus.fire(GoalStateEvents.GOALSTATE_CHANGED, {});
    if (parentStatement.operands.length === 0 && parentStatement.$parent) {
        this.deleteStatement(parentStatement);
    }
}

GoalStateModeler.prototype.handleStatesChanged = function (clazz, newStates) {
    //TODO
}

GoalStateModeler.prototype.handleOlcListChanged = function (classes) {
    this._classList = classes;
    if (classes.length === 0) {
        this._root.classList.add('no-dataclass');
    } else {
        this._root.classList.remove('no-dataclass');
    }
    if (this._goalState) {
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
        return {literalsToDelete : []};
    }
}

GoalStateModeler.prototype.getLiteralsWithClassId = function (id) {
    var literalsOfClass = [];
    this.forEachLiteral(literal => {
        if (literal.class.id === id) {
            literalsOfClass.push(literal);
        }
    });
    return literalsOfClass;
}

GoalStateModeler.prototype.getLiteralsWithState = function (state) {
    const literalsWithState = [];
    this.forEachLiteral(literal => {
        if (literal.states.includes(state)) {
            literalsWithState.push(literal);
        }
    });
    return literalsWithState;
}

GoalStateModeler.prototype.handleStateRenamed = function (state) {
    this.forEachLiteral(literal => {
        if (literal.states.includes(state)) {
            this.populateLiteral(literal, literal.element);
        }
    });
}

GoalStateModeler.prototype.handleStateDeleted = function (state) {
    this.forEachLiteral(literal => {
        if (literal.states.includes(state)) {
            literal.states = without(literal.states, state);
            this.populateLiteral(literal, literal.element);
        }
    });
}

GoalStateModeler.prototype.getLiterals = function() {
    //TODO refactor to use getStatements
    if (!this._goalState) return undefined;
    const statementsToVisit = [this._goalState];
    const visitedLiterals = [];
    while (statementsToVisit.length > 0) {
        var nextStatement = statementsToVisit.shift();
        if (is(nextStatement, 'gs:Literal')) {
            visitedLiterals.push(nextStatement);
        } else {
            statementsToVisit.push(...nextStatement.operands);
        }
    }
    return visitedLiterals;
}

GoalStateModeler.prototype.getStatements = function() {
    if (!this._goalState) return undefined;
    const statementsToVisit = [this._goalState];
    const visitedStatements = [];
    while (statementsToVisit.length > 0) {
        var nextStatement = statementsToVisit.shift();
        visitedStatements.push(nextStatement);
        if (is(nextStatement, 'gs:Operation')) {
            statementsToVisit.push(...nextStatement.operands);
        }
    }
    return visitedStatements;
}

GoalStateModeler.prototype.forEachLiteral = function(consumer) {
    return this.getLiterals().forEach(consumer);
}

GoalStateModeler.prototype.getClassList = function () {
    return this._classList || [];
}

GoalStateModeler.prototype.getStateList = function (clazz) {
    return clazz.get('Elements').filter(element => is(element, 'olc:State'));
}

GoalStateModeler.prototype.getGoalState = function () {
    return this._goalState;
}

GoalStateModeler.prototype.createNew = function () {
    this.showGoalState(this.moddle.create(
        'gs:Disjunction', 
        { operands: [] }
    ));
}

GoalStateModeler.prototype.saveXML = function (options = {}) {
    return new Promise((resolve, reject) => {
        this.moddle.toXML(this._goalState, options).then(function (result) {
            return resolve({ xml: result.xml });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

GoalStateModeler.prototype.importXML = function (xml) {
    return new Promise((resolve, reject) => {
      this.moddle.fromXML(xml).then((result) => {
        this.eventBus.fire('import.parse.complete', result);
        this.showGoalState(result.rootElement);
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