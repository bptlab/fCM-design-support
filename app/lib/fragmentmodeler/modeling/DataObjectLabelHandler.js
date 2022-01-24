import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor";
import {
    is
} from 'bpmn-js/lib/util/ModelUtil';
import { without } from 'min-dash';
import getDropdown from "../../util/Dropdown";
import { formatStates } from "../../util/Util";
import FragmentEvents from "../FragmentEvents";

export default class DataObjectLabelHandler extends CommandInterceptor {
    constructor(eventBus, modeling, directEditing, overlays, fragmentModeler) {
        super(eventBus);
        this._eventBus = eventBus;
        this._modeling = modeling;
        this._directEditing = directEditing;
        this._dropdownContainer = document.createElement('div');
        this._dropdownContainer.classList.add('dd-dropdown-multicontainer');
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
                const name = `${businessObject.dataclass?.name}\n${formatStates(businessObject.get('states'))}`;
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
                const olcs = this._fragmentModeler._olcs;
                const dataObject = e.element.businessObject;

                const updateStateSelection = () => {
                    this._stateDropdown.getEntries().forEach(entry => entry.setSelected(dataObject.get('states').includes(entry.option)));
                }

                const updateClassSelection = () => {
                    if (!dataObject.dataclass) {
                        this.updateClass(olcs[0].classRef, e.element);
                    }
                    let currentOlc = olcs.filter(olc => olc.classRef === dataObject.dataclass)[0];
                    this._classDropdown.getEntries().forEach(entry => entry.setSelected(entry.option === currentOlc));
                    const states = currentOlc.get('Elements').filter(element => is(element, 'olc:State'));
                   
                    this._stateDropdown.populate(states, (newState, element) => {
                        this.updateState(newState, element);
                        updateStateSelection();
                    }, e.element);

                    this._stateDropdown.addCreateElementInput(event => {
                        const state = this.createState(event.target.value, currentOlc);
                        this.updateState(state, e.element);
                        updateClassSelection();
                        updateStateSelection();
                    });
                }

                const populateClassDropdown = () => {
                    this._classDropdown.populate(olcs, (olc, element) => {
                        this.updateClass(olc.classRef, element);
                        updateClassSelection();
                    }, e.element);
                    this._classDropdown.addCreateElementInput(event => {
                        const clazz = this.createDataclass(event.target.value);
                        this.updateClass(clazz, e.element);
                        populateClassDropdown();
                    });
                    updateClassSelection();
                    updateStateSelection();
                }

                populateClassDropdown();

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
        element.businessObject.dataclass = newClass;
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

    createState(name, olc) {
        return this._eventBus.fire(FragmentEvents.CREATED_STATE, {
            name,
            olc
        });
    }

    createDataclass(name) {
        return this._eventBus.fire(FragmentEvents.CREATED_DATACLASS, {
            name
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
