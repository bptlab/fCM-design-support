import {isAny} from '../../../common/features/modeling/ModelingUtil';

export function getLabelAttr(element) {
    var semantic = element.businessObject;
    if (element.labelAttribute) {
        return element.labelAttribute;
    } else if (semantic.labelAttribute) {
        return semantic.labelAttribute;
    } else if (isAny(semantic, ['od:Association',])) {
        return 'targetCardinality';
    } else if (isAny(semantic, ['od:TextBox', 'od:Class'])) {
        return 'name';
    }
}

export function getLabel(element) {
    var semantic = element.businessObject;
    var attr = getLabelAttr(element);
    if (attr) {
        return semantic[attr] || '';
    }
}


export function setLabel(element, text) {
    var semantic = element.businessObject,
        attr = getLabelAttr(element);

    if (attr) {
        semantic[attr] = text;
    }

    return element;
}