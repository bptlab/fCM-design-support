import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor";
import {
    is
} from 'bpmn-js/lib/util/ModelUtil';
import { without } from 'min-dash';
import getDropdown from "../../util/Dropdown";
import { formatStates } from "../../util/Util";

export default class DataObjectLabelHandler extends CommandInterceptor {
    constructor(eventBus, modeling, directEditing, overlays, fragmentModeler) {
        super(eventBus);
        this._eventBus = eventBus;
        this._modeling = modeling;
        this._directEditing = directEditing;
        this._dropdownContainer = document.createElement('div');
        this._dropdownContainer.style.display = 'flex';
        this._classDropdown = getDropdown();
        this._dropdownContainer.appendChild(this._classDropdown);
        this._stateDropdown = getDropdown();
        this._dropdownContainer.appendChild(this._stateDropdown);
        this._currentDropdownTarget = undefined;
        this._overlayId = undefined;
        this._overlays = overlays;
        this._fragmentModeler = fragmentModeler;

        eventBus.on('element.changed', function (e) {
            if (is(e.element, 'bpmn:DataObjectReference')) {
                const businessObject = e.element.businessObject;
                const name = `${businessObject.dataclass}\n${formatStates(businessObject.get('states'))}`;
                if (businessObject.name !== name) {
                    modeling.updateLabel(e.element, name, undefined, {
                        dataObjectLabelUpdate: true
                    });
                }
            }
        });

        eventBus.on('directEditing.activate', function (e) {
            if (is(e.active.element, 'bpmn:DataObjectReference')) {
                directEditing.cancel();
            }
        });

        eventBus.on(['element.click', 'create.start'], event => {
            if (this._currentDropdownTarget && ((event.element || event.shape).businessObject !== this._currentDropdownTarget)) {
                this.cancel();
            }
        });

        eventBus.on(['element.dblclick' ], e => {
            if (is(e.element, 'bpmn:DataObjectReference')) {
                const classes = this._fragmentModeler._classes;
                const dataObject = e.element.businessObject;

                const updateStateSelection = () => {
                    this._stateDropdown.getEntries().forEach(entry => entry.setSelected(dataObject.get('states').includes(entry.option)));
                }
                const populateStates = (states) => {
                    this._stateDropdown.populate(states, (newState, element) => {
                        this.updateState(newState, element);
                        updateStateSelection();
                    }, e.element);
                }

                const updateClassSelection = () => {
                    let currentClass = classes.filter(clazz => clazz.name === dataObject.dataclass)[0];
                    if (!currentClass) {
                        currentClass = classes[0];
                        this.updateClass(currentClass, e.element);
                    }
                    this._classDropdown.getEntries().forEach(entry => entry.setSelected(entry.option === currentClass));
                    const states = currentClass.get('Elements').filter(element => is(element, 'olc:State'));
                    populateStates(states)
                }
                this._classDropdown.populate(classes, (newClass, element) => {
                    this.updateClass(newClass, element);
                    updateClassSelection();
                }, e.element);
                
                updateClassSelection();
                updateStateSelection();

                // Show the menu(e)
                this._overlayId = overlays.add(e.element.id, 'classSelection', {
                    position: {
                        bottom: 0,
                        right: 0
                    },
                    scale: false,
                    html: this._dropdownContainer
                });

                this._currentDropdownTarget = e.element.businessObject;
            }
        });
    }

    cancel() {
        this._currentDropdownTarget = undefined;
        if (this._overlayId) {
            this._overlays.remove(this._overlayId);
            this._overlayId = undefined;
        }
    }

    updateClass(newClass, element) {
        element.businessObject.dataclass = newClass.name;
        element.businessObject.states = [];
        this._eventBus.fire('element.changed', {
            element
        });
    }

    updateState(newState, element) {
        const dataObject = element.businessObject;
        if (dataObject.get('states').includes(newState)) {
            dataObject.states = without(dataObject.get('states'), newState);
        } else {
            dataObject.states.push(newState);
        }
        this._eventBus.fire('element.changed', {
            element
        });
    }
}

DataObjectLabelHandler.$inject = [
    'eventBus',
    'modeling',
    'directEditing',
    'overlays',
    'fragmentModeler'
];
