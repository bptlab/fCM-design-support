export function is(element, type) {
    var bo = getBusinessObject(element);
    return bo && (typeof bo.$instanceOf === 'function') && bo.$instanceOf(type);
}

export function getBusinessObject(element) {
    return (element && element.businessObject) || element;
}

export function formatStates(states, emptyValue='<empty>', mapper= x => x.name || x) {
    return '[' + (states.length > 0 ? states.map(mapper).join(' | ') : emptyValue) + ']';
}

export function root(element) {
    return element.parent || element.$parent || element;
}

export function namespace(element) {
    return (element.businessObject || element).$type.split(':')[0];
}