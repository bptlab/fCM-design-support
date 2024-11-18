import {getBusinessObject, is} from '../../../common/util/ModelUtil';

import {forEach,} from 'min-dash';

import * as replaceOptions from '../replace/ReplaceOptions';

// * @typedef {import('diagram-js/lib/features/Rules').default} Rules

/**
 * @typedef {import('../modeling/ODFactory').default} ODFactory
 * @typedef {import('diagram-js/lib/features/popup-menu/PopupMenu').default} PopupMenu
 * @typedef {import('../modeling/Modeling').default} Modeling
 * @typedef {import('../replace/DataModelReplace').default} DataModelReplace
 * @typedef {import('diagram-js/lib/i18n/translate/translate').default} Translate
 *
 * @typedef {import('../../model/Types').Element} Element
 * @typedef {import('../../model/Types').Moddle} Moddle
 *
 * @typedef {import('diagram-js/lib/features/popup-menu/PopupMenuProvider').PopupMenuEntries} PopupMenuEntries
 * @typedef {import('diagram-js/lib/features/popup-menu/PopupMenuProvider').PopupMenuEntry} PopupMenuEntry
 * @typedef {import('diagram-js/lib/features/popup-menu/PopupMenuProvider').PopupMenuEntryAction} PopupMenuEntryAction
 * @typedef {import('diagram-js/lib/features/popup-menu/PopupMenuProvider').PopupMenuHeaderEntries} PopupMenuHeaderEntries
 * @typedef {import('diagram-js/lib/features/popup-menu/PopupMenuProvider').default} PopupMenuProvider
 * @typedef {import('diagram-js/lib/features/popup-menu/PopupMenu').PopupMenuTarget} PopupMenuTarget
 *
 * @typedef {import('./ReplaceOptions').ReplaceOption} ReplaceOption
 */

/**
 *
 * @implements {PopupMenuProvider}
 *
 * @param {ODFactory} odFactory
 * @param {PopupMenu} popupMenu
 * @param {Modeling} modeling
 * @param {Moddle} moddle
 * @param {DataModelReplace} dataModelReplace
 * @param {Rules} rules
 * @param {Translate} translate
 */
export default function ReplaceMenuProvider(
    odFactory, popupMenu, modeling, moddle,
    dataModelReplace, rules, translate) {

    this._odFactory = odFactory;
    this._popupMenu = popupMenu;
    this._modeling = modeling;
    this._moddle = moddle;
    this._dataModelReplace = dataModelReplace;
    this._rules = rules;
    this._translate = translate;

    this._register();
}

ReplaceMenuProvider.$inject = [
    'odFactory',
    'popupMenu',
    'modeling',
    'moddle',
    'dataModelReplace',
    'rules',
    'translate'
];

ReplaceMenuProvider.prototype._register = function () {
    this._popupMenu.registerProvider('bpmn-replace', this);
};

/**
 * @param {PopupMenuTarget} target
 *
 * @return {PopupMenuEntries}
 */
ReplaceMenuProvider.prototype.getPopupMenuEntries = function (target) {

    var businessObject = target.businessObject;

    if (is(businessObject, 'od:Association')) {
        return this._createConnectionEntries(target, replaceOptions.CONNECTION);
    }

    return {};
};

/**
 * Create popup menu entries for the given target.
 *
 * @param  {PopupMenuTarget} target
 * @param  {ReplaceOption[]} replaceOptions
 *
 * @return {PopupMenuEntries}
 */
ReplaceMenuProvider.prototype._createEntries = function (target, replaceOptions) {
    var entries = {};

    var self = this;

    forEach(replaceOptions, function (replaceOption) {
        entries[replaceOption.actionName] = self._createEntry(replaceOption, target);
    });

    return entries;
};

/**
 * Creates popup menu entries for the given connection.
 *
 * @param  {PopupMenuTarget} target
 * @param  {ReplaceOption[]} replaceOptions
 *
 * @return {PopupMenuEntries}
 */
ReplaceMenuProvider.prototype._createConnectionEntries = function (target, replaceOptions) {

    var businessObject = getBusinessObject(target);

    var entries = {};

    var modeling = this._modeling,
        moddle = this._moddle;

    var self = this;

    forEach(replaceOptions, function (replaceOption) {
        switch (replaceOption.actionName) {
            case 'replace-with-association':
                entries = {
                    ...entries,
                    [replaceOption.actionName]: self._createEntry(replaceOption, target, function () {
                        modeling.updateProperties(target, {inheritance: false});
                        modeling.updateProperties(target, {sourceCardinality: '0..*'});
                        modeling.updateProperties(target, {targetCardinality: '0..*'});
                    })
                };
                break;
            case 'replace-with-inheritance':
                entries = {
                    ...entries,
                    [replaceOption.actionName]: self._createEntry(replaceOption, target, function () {
                        modeling.updateProperties(target, {inheritance: true});
                        modeling.updateProperties(target, {sourceCardinality: ''});
                        modeling.updateProperties(target, {targetCardinality: ''});
                    })
                };
                break;
            default:
                entries = {
                    ...entries,
                    [replaceOption.actionName]: self._createEntry(replaceOption, target, function () {
                    })
                };
        }
    });
    return entries;
};

/**
 * Create a popup menu entry for the given replace option.
 *
 * @param  {ReplaceOption} replaceOption
 * @param  {PopupMenuTarget} target
 * @param  {PopupMenuEntryAction} [action]
 *
 * @return {PopupMenuEntry}
 */

ReplaceMenuProvider.prototype._createEntry = function (replaceOption, target, action) {
    var translate = this._translate;
    var replaceElement = this._dataModelReplace.replaceElement;

    var replaceAction = function () {
        return replaceElement(target, replaceOption.target);
    };

    var label = replaceOption.label;
    if (label && typeof label === 'function') {
        label = label(target);
    }

    action = action || replaceAction;

    return {
        label: translate(label),
        className: replaceOption.className,
        action: action
    };
};