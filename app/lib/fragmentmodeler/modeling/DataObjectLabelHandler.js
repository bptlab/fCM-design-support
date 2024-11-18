import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor";
import {without} from 'min-dash';
import CommonEvents from "../../common/CommonEvents";
import getDropdown from "../../util/Dropdown";
import {appendOverlayListeners} from "../../util/HtmlUtil";
import {formatStates, is} from "../../util/Util";

export default class DataObjectLabelHandler extends CommandInterceptor {
    constructor(eventBus, modeling, directEditing, overlays, fragmentModeler) {
        super(eventBus);
        this._eventBus = eventBus;
        this._modeling = modeling;
        this._directEditing = directEditing;
        this._dropdownContainer = document.createElement('div');
        this._dropdownContainer.classList.add('dd-dropdown-multicontainer');
        this._classDropdown = getDropdown("Class");
        this._dropdownContainer.appendChild(this._classDropdown);
        this._stateDropdown = getDropdown("States");
        this._dropdownContainer.appendChild(this._stateDropdown);
        this._currentDropdownTarget = undefined;
        this._overlayId = undefined;
        this._overlays = overlays;
        this._fragmentModeler = fragmentModeler;

        eventBus.on('element.changed', function (e) {
            if (is(e.element, 'bpmn:DataObjectReference') && e.element.parent) {
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

        eventBus.on(['element.dblclick', 'create.end', 'autoPlace.end'], e => {
            const element = e.element || e.shape || e.elements[0];
            if (is(element, 'bpmn:DataObjectReference')) {
                const olcs = this._fragmentModeler._olcs;
                const dataObject = element.businessObject;
                this._dropdownContainer.currentElement = element;
                let currentOlc = undefined;

                const updateStateSelection = () => {
                    this._stateDropdown.getEntries().forEach(entry => entry.setSelected(dataObject.get('states').includes(entry.option)));
                }

                const updateClassSelection = () => {
                    if (olcs.length > 0) {
                        let states = [];
                        if (dataObject.dataclass) {
                            currentOlc = olcs.filter(olc => olc.classRef === dataObject.dataclass)[0];
                            this._classDropdown.getEntries().forEach(entry => entry.setSelected(entry.option === currentOlc));
                            states = currentOlc.get('Elements').filter(element => is(element, 'olc:State'));
                        }

                        this._stateDropdown.populate(states, (newState, element) => {
                            this.updateState(newState, element);
                            updateStateSelection();
                        }, element);

                        // Prevent adding new states if no dataclass is selected
                        dataObject.dataclass && this._stateDropdown.addCreateElementInput(event => this._dropdownContainer.confirm());
                    } else {
                        this._stateDropdown.populate([], (newState, element) => {
                            this.updateState(newState, element);
                            updateStateSelection();
                        }, element);
                    }
                }

                const populateClassDropdown = () => {
                    this._classDropdown.populate(olcs, (olc, element) => {
                        this.updateClass(olc.classRef, element);
                        updateClassSelection();
                    }, element);
                    this._classDropdown.addCreateElementInput(event => this._dropdownContainer.confirm());
                    updateClassSelection();
                    updateStateSelection();
                }

                populateClassDropdown();

                this._dropdownContainer.confirm = (event) => {
                    const newClassInput = this._classDropdown.getInputValue().trim();
                    const newStateInput = this._stateDropdown.getInputValue().trim();
                    let needUpdate = false;
                    if (newClassInput !== '') {
                        const newClass = this.createDataclass(newClassInput);
                        this.updateClass(newClass, element);
                        populateClassDropdown();
                        needUpdate = true;
                    }
                    if (newStateInput !== '') {
                        const newState = this.createState(newStateInput, currentOlc);
                        this.updateState(newState, element);
                        needUpdate = true;
                    }
                    if (needUpdate) {
                        updateClassSelection();
                        updateStateSelection();
                        this._stateDropdown.focusInput();
                    }
                }

                let shouldBlockNextClick = e.type === 'create.end';
                this._dropdownContainer.handleClick = (event) => {
                    if (shouldBlockNextClick) {
                        shouldBlockNextClick = false;
                        return true;
                    } else if (!this._dropdownContainer.contains(event.target)) {
                        return false;
                    } else if (event.target.classList.contains('dd-dropdown-entry')) {
                        this._classDropdown.clearInput();
                        this._stateDropdown.clearInput();
                    } else if (event.target.tagName !== 'INPUT' || !event.target.value) {
                        this._dropdownContainer.confirm();
                    }
                    return true;
                }

                this._dropdownContainer.close = () => {
                    if (this._overlayId) {
                        this._overlays.remove(this._overlayId);
                        this._overlayId = undefined;
                    }
                    this._dropdownContainer.currentElement = undefined;
                    this._currentDropdownTarget = undefined;
                }

                const closeOverlay = appendOverlayListeners(this._dropdownContainer);
                eventBus.once('element.contextmenu', event => {
                    if (this._currentDropdownTarget && ((event.element || event.shape).businessObject !== this._currentDropdownTarget)) {
                        closeOverlay(event);
                        event.preventDefault();
                    }
                });

                // Show the menu(e)
                this._overlayId = overlays.add(element.id, 'classSelection', {
                    position: {
                        bottom: 0,
                        right: 0
                    },
                    scale: false,
                    html: this._dropdownContainer
                });

                this._currentDropdownTarget = element.businessObject;
            }
        });
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
        return this._eventBus.fire(CommonEvents.STATE_CREATION_REQUESTED, {
            name,
            olc
        });
    }

    createDataclass(name) {
        return this._eventBus.fire(CommonEvents.DATACLASS_CREATION_REQUESTED, {
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
