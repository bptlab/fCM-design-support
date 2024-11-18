import {getBusinessObject} from '../../../util/ModelUtil';

/**
 * @typedef {import('../../../model/Types').Element} Element
 * @typedef {import('diagram-js/lib/features/popup-menu/PopupMenu').PopupMenuTarget} PopupMenuTarget
 *
 * @typedef {(entry: PopupMenuTarget) => boolean} DifferentTypeValidator
 */

/**
 * Returns true, if an element is from a different type
 * than a target definition. Takes into account the type,
 * event definition type and triggeredByEvent property.
 *
 * @param {Element} element
 *
 * @return {DifferentTypeValidator}
 */
export function isDifferentType(element) {

    return function (entry) {
        var target = entry.target;

        var businessObject = getBusinessObject(element),
            eventDefinition = businessObject.eventDefinitions && businessObject.eventDefinitions[0];

        var isTypeEqual = businessObject.$type === target.type;

        var isEventDefinitionEqual = (
            (eventDefinition && eventDefinition.$type) === target.eventDefinitionType
        );

        var isTriggeredByEventEqual = (

            // coherse to <false>
            !!target.triggeredByEvent === !!businessObject.triggeredByEvent
        );

        return !isTypeEqual || !isEventDefinitionEqual || !isTriggeredByEventEqual /*|| !isExpandedEqual*/;
    };
}