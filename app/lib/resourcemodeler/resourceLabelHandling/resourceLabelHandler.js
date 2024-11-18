import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor";
import CommonEvents from "../../common/CommonEvents";
import getDropdown from "../../util/Dropdown";
import { appendOverlayListeners } from "../../util/HtmlUtil";
import { is } from "../../util/Util";
import { without } from "min-dash";

export default class ResourceLabelHandler extends CommandInterceptor {
  constructor(eventBus, modeling, directEditing, overlays, resourceModeler) {
    super(eventBus);
    this._eventBus = eventBus;
    this._modeling = modeling;
    this._dropdownContainer = document.createElement("div");
    this._dropdownContainer.classList.add("dd-dropdown-multicontainer");
    this._nameDropdown = getDropdown("Name");
    this._dropdownContainer.appendChild(this._nameDropdown);
    this._rolesDropdown = getDropdown("Roles");
    this._dropdownContainer.appendChild(this._rolesDropdown);
    this._capacityDropdown = getDropdown("Capacity");
    this._dropdownContainer.appendChild(this._capacityDropdown);
    this._availabilityStartDropdown = getDropdown("Availability Start");
    this._dropdownContainer.appendChild(this._availabilityStartDropdown);
    this._availabilityEndDropdown = getDropdown("Availability End");
    this._dropdownContainer.appendChild(this._availabilityEndDropdown);
    this._currentDropdownTarget = undefined;
    this._overlayId = undefined;
    this._overlays = overlays;
    this._resourceModeler = resourceModeler;

    eventBus.on("directEditing.activate", function (e) {
      if (is(e.active.element, "rem:Resource")) {
        directEditing.cancel();
      }
    });

    eventBus.on(["element.dblclick", "create.end", "autoPlace.end"], (e) => {
      const element = e.element || e.shape || e.elements[0];
      if (is(element, "rem:Resource")) {
        const resource = element.businessObject;
        this._dropdownContainer.currentElement = element;

        const updateRolesSelection = () => {
          this._rolesDropdown
            .getEntries()
            .forEach((entry) =>
              entry.setSelected(
                resource.roles?.find((role) => role === entry.option)
              )
            );
        };

        const populateNameDropdown = () => {
          this._nameDropdown.populate([], () => {}, element);
          this._nameDropdown.addCreateElementInput(
            (event) => this._dropdownContainer.confirm(),
            "text",
            resource.name
          );
        };

        const populateCapacityDropdown = () => {
          this._capacityDropdown.populate([], () => {}, element);
          this._capacityDropdown.addCreateElementInput(
            (event) => this._dropdownContainer.confirm(),
            "number",
            resource.capacity
          );
        };

        const populateRolesDropdown = () => {
          this._rolesDropdown.populate(
            this._resourceModeler._roles || [], // TODO Change this to the list of roles instead of an empty list
            (role, element) => {
              this.updateRoles(role, element);
              updateRolesSelection();
            },
            element
          );
          this._rolesDropdown.addCreateElementInput((event) =>
            this._dropdownContainer.confirm()
          );
          updateRolesSelection();
        };

        const populateAvailabilityStartDropdown = () => {
          this._availabilityStartDropdown.populate([], () => {}, element);
          this._availabilityStartDropdown.addCreateElementInput(
            (event) => this._dropdownContainer.confirm(),
            "number",
            resource.availabilityStart,
            "0"
          );
        };

        const populateAvailabilityEndDropdown = () => {
          this._availabilityEndDropdown.populate([], () => {}, element);
          this._availabilityEndDropdown.addCreateElementInput(
            (event) => this._dropdownContainer.confirm(),
            "number",
            resource.availabilityEnd,
            "0"
          );
        };

        populateNameDropdown();
        populateCapacityDropdown();
        populateRolesDropdown();
        populateAvailabilityStartDropdown();
        populateAvailabilityEndDropdown();

        this._dropdownContainer.confirm = (event) => {
          const newNameInput = this._nameDropdown.getInputValue().trim();
          const newCapacityInput = this._capacityDropdown
            .getInputValue()
            .trim();
          const newRoleInput = this._rolesDropdown.getInputValue().trim();
          const newAvailabilityStartInput = this._availabilityStartDropdown
            .getInputValue()
            .trim();
          const newAvailabilityEndInput = this._availabilityEndDropdown
            .getInputValue()
            .trim();

          if (newNameInput !== "" && newNameInput !== resource.name) {
            this.updateName(newNameInput, element);
            populateNameDropdown();
          }
          if (newCapacityInput !== resource.capacity && newCapacityInput > 0) {
            this.updateCapacity(newCapacityInput, element);
            populateCapacityDropdown();
          }
          if (
            newRoleInput !== "" &&
            !this._resourceModeler._roles?.find(
              (role) => role.name === newRoleInput
            )
          ) {
            let newRole = this.createRole(newRoleInput);
            this.updateRoles(newRole, element);
            populateRolesDropdown();
          }
          if (
            newAvailabilityStartInput !== resource.availabilityStart &&
            newAvailabilityStartInput >= 0
          ) {
            this.updateavailabilityStart(newAvailabilityStartInput, element);
            populateAvailabilityStartDropdown();
          }
          if (
            newAvailabilityEndInput !== resource.availabilityEnd &&
            newAvailabilityEndInput >= 0
          ) {
            this.updateavailabilityEnd(newAvailabilityEndInput, element);
            populateAvailabilityEndDropdown();
          }
        };

        let shouldBlockNextClick = e.type === "create.end";
        this._dropdownContainer.handleClick = (event) => {
          if (shouldBlockNextClick) {
            shouldBlockNextClick = false;
            return true;
          } else if (!this._dropdownContainer.contains(event.target)) {
            return false;
          } else if (event.target.classList.contains("dd-dropdown-entry")) {
            this._rolesDropdown.clearInput();
          } else if (event.target.tagName !== "INPUT" || !event.target.value) {
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
        eventBus.once("element.contextmenu", (event) => {
          if (
            this._currentDropdownTarget &&
            (event.element || event.shape).businessObject !==
              this._currentDropdownTarget
          ) {
            closeOverlay(event);
            event.preventDefault();
          }
        });

        // Show the menu(e)
        this._overlayId = overlays.add(element.id, "classSelection", {
          position: {
            bottom: 0,
            right: 0,
          },
          scale: false,
          html: this._dropdownContainer,
        });

        this._currentDropdownTarget = element.businessObject;
      }
    });
  }

  updateName(newName, element) {
    element.businessObject.name = newName;
    this._eventBus.fire("element.changed", {
      element,
    });
  }

  updateCapacity(newCapacity, element) {
    element.businessObject.capacity = newCapacity;
    this._eventBus.fire("element.changed", {
      element,
    });
  }

  createRole(name) {
    return this._eventBus.fire(CommonEvents.ROLE_CREATION_REQUESTED, {
      name,
    });
  }

  updateRoles(newRole, element) {
    if (element.businessObject.roles?.find((role) => role === newRole)) {
      element.businessObject.roles = without(
        element.businessObject.roles,
        newRole
      );
    } else if (element.businessObject.roles) {
      element.businessObject.roles.push(newRole);
    } else {
      element.businessObject.roles = [newRole];
    }
    this._eventBus.fire("element.changed", {
      element,
    });
  }

  updateavailabilityStart(newAvailabilityStart, element) {
    element.businessObject.availabilityStart = newAvailabilityStart;
    this._eventBus.fire("element.changed", {
      element,
    });
  }

  updateavailabilityEnd(newAvailabilityEnd, element) {
    element.businessObject.availabilityEnd = newAvailabilityEnd;
    this._eventBus.fire("element.changed", {
      element,
    });
  }
}

ResourceLabelHandler.$inject = [
  "eventBus",
  "modeling",
  "directEditing",
  "overlays",
  "resourceModeler",
];
