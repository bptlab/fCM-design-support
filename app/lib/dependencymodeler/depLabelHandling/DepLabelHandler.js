import getDropdown from "../../util/Dropdown";
import {appendOverlayListeners} from "../../util/HtmlUtil";
import {is} from "../../util/Util";
import ObjectiveEvents from "../../objectivemodeler/ObjectiveEvents";

import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor";

export default class DepLabelHandler extends CommandInterceptor {
    constructor(eventBus, modeling, directEditing, overlays, dependencyModeler) {
        super(eventBus);
        this._eventBus = eventBus;
        this._modeling = modeling;
        this._directEditing = directEditing;
        this._dropdownContainer = document.createElement('div');
        this._dropdownContainer.classList.add('dd-dropdown-multicontainer');
        this._nameDropdown = getDropdown("Name");
        this._dropdownContainer.appendChild(this._nameDropdown);
        this._timeDropdown = getDropdown("Time");
        this._dropdownContainer.appendChild(this._timeDropdown);
        this._currentDropdownTarget = undefined;
        this._overlayId = undefined;
        this._overlays = overlays;
        this._dependencyModeler = dependencyModeler;

        eventBus.on('directEditing.activate', function (e) {
            if (is(e.active.element, 'dep:Objective')) {
                directEditing.cancel();
            }
        });

        eventBus.on(['element.dblclick', 'create.end', 'autoPlace.end'], e => {
            const element = e.element || e.shape || e.elements[0];
            if (is(element, 'dep:Objective') && element.businessObject.id !== 'start_state') {
                const objective = element.businessObject;
                this._dropdownContainer.currentElement = element;

                const populateNameDropdown = () => {
                    this._nameDropdown.populate(
                        [],
                        {},
                        element
                    );
                    this._nameDropdown.addCreateElementInput(event => this._dropdownContainer.confirm(), "text", objective.name);
                };
                const populateTimeDropdown = () => {
                    this._timeDropdown.populate(
                        [],
                        () => {
                        },
                        element
                    );
                    this._timeDropdown.addCreateElementInput(event => this._dropdownContainer.confirm(), "number", objective.date);
                };
                populateNameDropdown();
                populateTimeDropdown();

                this._dropdownContainer.confirm = (event) => {
                    const newNameInput = this._nameDropdown.getInputValue().trim();
                    const newTimeInput = this._timeDropdown.getInputValue().trim();
                    let needUpdate = false;
                    if (newNameInput !== '' && newNameInput !== objective.name) {
                        this.updateName(newNameInput, element);
                        populateNameDropdown();
                        needUpdate = true;
                    }
                    if (newTimeInput !== objective.date) {
                        this.updateTime(newTimeInput, element);
                        populateTimeDropdown();
                        needUpdate = true;
                    }
                    if (needUpdate) {
                        this._nameDropdown.focusInput();
                        this._timeDropdown.focusInput();
                    }
                };

                let shouldBlockNextClick = e.type === 'create.end';
                this._dropdownContainer.handleClick = (event) => {
                    if (shouldBlockNextClick) {
                        shouldBlockNextClick = false;
                        return true;
                    } else if (!this._dropdownContainer.contains(event.target)) {
                        return false;
                    } else if (event.target.classList.contains('dd-dropdown-entry')) {
                        this._nameDropdown.clearInput();
                        this._timeDropdown.clearInput();
                    } else if (event.target.tagName !== 'INPUT' || !event.target.value) {
                        this._dropdownContainer.confirm();
                    }
                    return true;
                };

                this._dropdownContainer.close = () => {
                    if (this._overlayId) {
                        this._overlays.remove(this._overlayId);
                        this._overlayId = undefined;
                    }
                    this._dropdownContainer.currentElement = undefined;
                    this._currentDropdownTarget = undefined;
                };

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
    };

    updateName(newName, element) {
        element.businessObject.name = newName;
        this._eventBus.fire('element.changed', {
            element
        });
        this._eventBus.fire(ObjectiveEvents.OBJECTIVE_RENAMED, {
            objective: element
        });
    };

    updateTime(newTime, element) {
        element.businessObject.date = newTime;
        this._eventBus.fire('element.changed', {
            element
        });
    };
}

DepLabelHandler.$inject = [
    'eventBus',
    'modeling',
    'directEditing',
    'overlays',
    'dependencyModeler'
];
