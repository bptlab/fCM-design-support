export function is(element, type) {
    var bo = getBusinessObject(element);
    return bo && (typeof bo.$instanceOf === 'function') && bo.$instanceOf(type);
}

export function getBusinessObject(element) {
    return (element && element.businessObject) || element;
}