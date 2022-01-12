import { is } from 'bpmn-js/lib/util/ModelUtil';

export default function FragmentReplaceMenuProvider(popupMenu, bpmnReplace, translate) {
    popupMenu.registerProvider('bpmn-replace', this);
}

FragmentReplaceMenuProvider.$inject = [
    'popupMenu'
];

FragmentReplaceMenuProvider.prototype.getPopupMenuEntries = function(element) {
    return function(entries) {
        if (is(element, 'bpmn:Event')) {
            delete entries['replace-with-none-end'];
            delete entries['replace-with-escalation-intermediate-throw'];
            delete entries['replace-with-link-intermediate-throw'];
            delete entries['replace-with-link-intermediate-catch'];
        }

        return entries;
    }
}
