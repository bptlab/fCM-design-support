import {assign, isArray,} from 'min-dash';

import {hasPrimaryModifier} from 'diagram-js/lib/util/Mouse';

import {is} from '../../../common/util/ModelUtil';


/**
 * A provider for od elements context pad.
 */
export default function ContextPadProvider(
    config, injector, eventBus, connect, create,
    elementFactory, elementRegistry, contextPad, modeling, rules,
    translate, popupMenu) {

    config = config || {};

    contextPad.registerProvider(this);

    this._connect = connect;
    this._create = create;
    this._elementFactory = elementFactory;
    this._elementRegistry = elementRegistry;
    this._contextPad = contextPad;

    this._modeling = modeling;

    this._rules = rules;
    this._translate = translate;
    this._popupMenu = popupMenu;

    if (config.autoPlace !== false) {
        this._autoPlace = injector.get('autoPlace', false);
    }

    eventBus.on('create.end', 250, function (event) {
        let context = event.context,
            shape = context.shape;

        if (!hasPrimaryModifier(event) || !contextPad.isOpen(shape)) {
            return;
        }

        let entries = contextPad.getEntries(shape);

        if (entries.replace) {
            entries.replace.action.click(event, shape);
        }
    });
}

ContextPadProvider.$inject = [
    'config.contextPad',
    'injector',
    'eventBus',
    'connect',
    'create',
    'elementFactory',
    'elementRegistry',
    'contextPad',
    'modeling',
    'rules',
    'translate',
    'popupMenu'
];


ContextPadProvider.prototype.getContextPadEntries = function (element) {

    const {
        _rules: rules,
        _modeling: modeling,
        _translate: translate,
        _connect: connect,
        _elementFactory: elementFactory,
        _elementRegistry: elementRegistry,
        _autoPlace: autoPlace,
        _create: create,
        _popupMenu: popupMenu,
        _contextPad: contextPad
    } = this;

    let actions = {};

    if (element.type === 'label') {
        return actions;
    }

    function getReplaceMenuPosition(element) {

        var Y_OFFSET = 5;

        var pad = contextPad.getPad(element).html;

        var padRect = pad.getBoundingClientRect();

        var pos = {
            x: padRect.left,
            y: padRect.bottom + Y_OFFSET
        };

        return pos;
    }

    if (!popupMenu.isEmpty(element, 'bpmn-replace')) {
        // Replace menu entry
        assign(actions, {
            'replace': {
                group: 'edit',
                className: 'bpmn-icon-screw-wrench',
                title: translate('Change type'),
                action: {
                    click: function (event, element) {

                        var position = assign(getReplaceMenuPosition(element), {
                            cursor: {x: event.x, y: event.y}
                        });

                        popupMenu.open(element, 'bpmn-replace', position, {
                            title: translate('Change element'),
                            width: 300,
                            search: true
                        });
                    }
                }
            }
        });
    }

    createDeleteEntry(actions);

    if (element.type === 'od:Class') {
        createLinkObjectsEntry(actions);
        createLinkNewObjectEntry(actions);
        createLinkMakeCaseClass(actions);
    }

    return actions;

    function removeElement() {
        modeling.removeElements([element]);
    }

    function makeCaseClass() {

        var classes = elementRegistry.filter(element => is(element, 'od:Class'));

        // set all case classes to false
        classes.forEach(clazz => modeling.updateProperties(clazz, {caseClass: false}));

        // set case class for context element to true
        modeling.updateProperties(element, {caseClass: true})
    }

    function createDeleteEntry(actions) {

        // delete element entry, only show if allowed by rules
        let deleteAllowed = rules.allowed('elements.delete', {elements: [element]});

        if (isArray(deleteAllowed)) {

            // was the element returned as a deletion candidate?
            deleteAllowed = deleteAllowed[0] === element;
        }

        if (deleteAllowed) {
            assign(actions, {
                'delete': {
                    group: 'edit',
                    className: 'bpmn-icon-trash',
                    title: translate('Remove'),
                    action: {
                        click: removeElement
                    }
                }
            });
        }
    }

    function startConnect(event, element) {
        connect.start(event, element);
    }

    function createLinkObjectsEntry(actions) {
        assign(actions, {
            'connect': {
                group: 'connect',
                className: 'bpmn-icon-connection',
                title: 'Link object to other objects',
                action: {
                    click: startConnect,
                    dragstart: startConnect,
                },
            },
        });
    }

    function createLinkNewObjectEntry(actions) {
        assign(actions, {
            'append.append-task': appendAction(
                'od:Class',
                'bpmn-icon-od-class',
                translate('Link with new object')
            ),
        });
    }

    function createLinkMakeCaseClass(actions) {

        var createCaseClassAllowed = true;
        if (element.businessObject.caseClass == true) {
            createCaseClassAllowed = false;
        }

        if (createCaseClassAllowed) {
            assign(actions, {
                'make-case-class': {
                    group: 'make-case-class',
                    className: 'od-case-class',
                    title: 'Toggle case class',
                    action: {
                        click: makeCaseClass
                    },
                },
            });
        }
    }

    /**
     * Create an append action
     *
     * @param {string} type
     * @param {string} className
     * @param {string} [title]
     * @param {Object} [options]
     *
     * @return {Object} descriptor
     */
    function appendAction(type, className, title, options) {

        if (typeof title !== 'string') {
            options = title;
            title = translate('Append {type}', {type: type.replace(/^bpmn:/, '')});
        }

        function appendStart(event, element) {

            var shape = elementFactory.createShape(assign({type: type}, options));
            create.start(event, shape, {
                source: element
            });
        }


        var append = autoPlace ? function (event, element) {
            var shape = elementFactory.createShape(assign({type: type}, options));

            autoPlace.append(element, shape);
        } : appendStart;


        return {
            group: 'model',
            className: className,
            title: title,
            action: {
                dragstart: appendStart,
                click: append
            }
        };
    }
};