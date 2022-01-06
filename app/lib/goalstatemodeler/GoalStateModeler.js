import $ from 'jquery';

export default function GoalStateModeler(container) {
    var root = document.createElement('div');
    root.classList.add('gs-root');
    $(container).get(0).appendChild(root);
    this._root = root;
}

GoalStateModeler.prototype.showGoalStatement = function(goalStatement) {
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

GoalStateModeler.prototype.handleStatement = function(parentElement, statement) {
    return this._handlers[statement.type || 'literal'].call(this, parentElement, statement);
}

GoalStateModeler.prototype.createDisjunctionElement = function(parentElement, disjunction) {
    return this.createOperationElement(parentElement, disjunction, '∨', 'gs-disjunction');
}

GoalStateModeler.prototype.createConjunctionElement = function(parentElement, conjunction) {
    return this.createOperationElement(parentElement, conjunction, '∧', 'gs-conjunction');
}

GoalStateModeler.prototype.createOperationElement = function(parentElement, operation, operationSymbol, ...cssClasses) {
    var element = document.createElement('div');
    cssClasses.push('gs-operation');
    cssClasses.forEach(clazz => element.classList.add(clazz));
    //element.append('(');
    operation.operands.forEach(operand => {
        if (operand !== operation.operands[0]) this.addSymbol(element, operationSymbol);
        this.handleStatement(element, operand);
    });
    //element.append(')');
    parentElement.appendChild(element);
    return element;
}

GoalStateModeler.prototype.createLiteralElement = function(parentElement, literal) {
    var text = literal.class + '[' + literal.state + ']';
    var element = makeSpan(text, 'gs-literal');
    parentElement.append(element);
    return element;
}

GoalStateModeler.prototype.addSymbol = function(parentElement, symbol) {
    var element = makeSpan(' ' + symbol + ' ', 'gs-operator');
    parentElement.append(element);
    return element;
}

GoalStateModeler.prototype.clear = function() {
    var root = this._root;
    while(root.firstChild) root.removeChild(root.lastChild);
}

function makeSpan(text, ...classes) {
    var element = document.createElement('span');
    element.innerHTML = text;
    classes.forEach(clazz => element.classList.add(clazz));
    return element;
}

export var dummy = {
    type: 'disjunction',
    operands: [
        {
            type: 'conjunction',
            operands: [
                {type: 'literal', class: 'Paper', state: 'Accepted|Rejected'},
                {type: 'literal', class: 'Conference', state: 'Planned'},
                {type: 'literal', class: 'Decision', state: 'Done'}
            ]
        },
        {
            type: 'conjunction',
            operands: [
                {type: 'literal', class: 'Paper', state: 'Accepted|Rejected'},
                {type: 'literal', class: 'Conference', state: 'Canceled'},
                {type: 'literal', class: 'Decision', state: 'Done'}
            ]
        },
        {
            type: 'conjunction',
            operands: [
                {type: 'literal', class: 'Unicorn', state: 'Found'}
            ]
        },
    ]
}