import { is } from '../../util/Util';

export default function FragmentReplaceMenuProvider(popupMenu) {
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
            delete entries['replace-with-compensation-intermediate-throw'];
        }

        if (is(element, 'bpmn:Task')) {
            delete entries['replace-with-expanded-subprocess'];
            delete entries['replace-with-collapsed-subprocess'];
            delete entries['replace-with-call-activity'];
        }

        if (is(element, 'bpmn:Gateway')) {
            delete entries['replace-with-complex-gateway'];
            delete entries['replace-with-inclusive-gateway'];
            delete entries['replace-with-parallel-gateway'];
        }

        if (is(element, 'bpmn:DataObjectReference')) {
            delete entries['replace-with-data-store-reference'];
        }

        return entries;
    }
}

FragmentReplaceMenuProvider.prototype.getPopupMenuHeaderEntries = function(element) {
    return function(entries) {
        if (is(element, 'bpmn:Activity')) {
            return {};
        } else {
            return entries;
        }
    }
}
