export function is(element, type) {
    var bo = getBusinessObject(element);
    return bo && (typeof bo.$instanceOf === 'function') && bo.$instanceOf(type);
}

export function getBusinessObject(element) {
    return (element && element.businessObject) || element;
}

export function formatStates(states, emptyValue = '<empty>', mapper = x => x.name || x) {
    return '[' + (states?.length > 0 ? states?.map(mapper).join(' | ') : emptyValue) + ']';
}

export function root(element) {
    return element.parent || element.$parent || element;
}

export function namespace(element) {
    return (element.businessObject || element).$type?.split(':')[0];
}

export function type(element) {
    return (element.businessObject || element).$type?.split(':')[1];
}

export function nextPosition(modeler, type) {
    const existingStates = modeler.get('elementRegistry').filter(element => is(element, type));
    const rightBorder = Math.max(...existingStates.map(element => element.x + element.width * 3 / 2));
    const topBorder = Math.min(...existingStates.map(element => element.y + element.height / 2));

    const x = (isFinite(rightBorder) ? rightBorder : 0) + 50;
    const y = isFinite(topBorder) ? topBorder : 0;

    return {x, y};
}