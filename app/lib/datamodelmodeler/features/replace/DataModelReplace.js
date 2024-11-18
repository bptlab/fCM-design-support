import {filter, forEach, has, isArray, isUndefined} from 'min-dash';

import {getPropertyNames} from '../../../common/features/copy-paste/ModdleCopy';

/**
 * @typedef {import('../modeling/ODFactory').default} ODFactory
 * @typedef {import('../modeling/ElementFactory').default} ElementFactory
 * @typedef {import('../copy-paste/ModdleCopy').default} ModdleCopy
 * @typedef {import('../modeling/Modeling').default} Modeling
 * @typedef {import('diagram-js/lib/features/replace/Replace').default} Replace
 * @typedef {import('diagram-js/lib/features/rules/Rules').default} Rules
 *
 * @typedef {import('../../model/Types').Element} Element
 * @typedef {import('../../model/Types').Shape} Shape
 * @typedef {import('../../model/Types').ModdleElement} ModdleElement
 *
 * @typedef { {
 *   type: string;
 * } } TargetElement
 *
 */

function copyProperties(source, target, properties) {
    if (!isArray(properties)) {
        properties = [properties];
    }

    forEach(properties, function (property) {
        if (!isUndefined(source[property])) {
            target[property] = source[property];
        }
    });
}

/**
 *
 *
 * @param {ODFactory} odFactory
 * @param {ElementFactory} elementFactory
 * @param {ModdleCopy} moddleCopy
 * @param {Modeling} modeling
 * @param {Replace} replace
 * @param {Rules} rules
 */
export default function DataModelReplace(
    odFactory,
    elementFactory,
    moddleCopy,
    modeling,
    replace,
    rules
) {

    /**
     * Prepares a new business object for the replacement element
     * and triggers the replace operation.
     *
     * @param  {Element} element
     * @param  {TargetElement} targetElement
     * @param  {Hints} [hints]
     *
     * @return {Element}
     */
    function replaceElement(element, targetElement, hints) {

        hints = hints || {};

        var type = targetElement.type,
            oldBusinessObject = element.businessObject;

        var newBusinessObject = odFactory.create(type);

        var newElement = {
            type: type,
            businessObject: newBusinessObject,
        };

        newElement.di = {};

        // colors will be set to DI
        copyProperties(element.di, newElement.di, [
            'fill',
            'stroke',
            'background-color',
            'border-color',
            'color'
        ]);

        var elementProps = getPropertyNames(oldBusinessObject.$descriptor),
            newElementProps = getPropertyNames(newBusinessObject.$descriptor, true),
            copyProps = intersection(elementProps, newElementProps);

        var properties = filter(copyProps, function (propertyName) {

            // so the applied properties from 'target' don't get lost
            if (has(newBusinessObject, propertyName)) {
                return false;
            }

            return true;
        });

        newBusinessObject = moddleCopy.copyElement(
            oldBusinessObject,
            newBusinessObject,
            properties
        );

        if (!rules.allowed('shape.resize', {shape: newBusinessObject})) {
            newElement.height = elementFactory.getDefaultSize(newElement).height;
            newElement.width = elementFactory.getDefaultSize(newElement).width;
        }

        newBusinessObject.name = oldBusinessObject.name;

        return replace.replaceElement(element, newElement, hints);
    }

    this.replaceElement = replaceElement;
}

DataModelReplace.$inject = [
    'odFactory',
    'elementFactory',
    'moddleCopy',
    'modeling',
    'replace',
    'rules'
];

/**
 * Compute intersection between two arrays.
 *
 * @param {Array} a
 * @param {Array} b
 *
 * @return {Array}
 */
function intersection(a, b) {
    return a.filter(function (item) {
        return b.includes(item);
    });
}