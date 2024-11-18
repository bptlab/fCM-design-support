import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor";
import CommonEvents from "../../common/CommonEvents";
import getDropdown from "../../util/Dropdown";
import { appendOverlayListeners } from "../../util/HtmlUtil";
import { without } from "min-dash";

import { is } from "../../util/Util";

export default class LaneLabelHandler extends CommandInterceptor {
  constructor(eventBus, modeling, directEditing, overlays, fragmentModeler) {
    super(eventBus);
    this._eventBus = eventBus;
    this._modeling = modeling;
    this._dropdownContainer = document.createElement("div");
    this._dropdownContainer.classList.add("dd-dropdown-multicontainer");

    this._unitsDropdown = getDropdown("Organizational Units");
    this._dropdownContainer.appendChild(this._unitsDropdown);
    this._rolesDropdown = getDropdown("Positions/Roles");
    this._dropdownContainer.appendChild(this._rolesDropdown);
    this._orgResourcesDropdown = getDropdown("Resources");
    this._dropdownContainer.appendChild(this._orgResourcesDropdown);

    this._currentDropdownTarget = undefined;
    this._overlayId = undefined;
    this._overlays = overlays;
    this._fragmentModeler = fragmentModeler;

    eventBus.on("directEditing.activate", function (e) {
      if (is(e.active.element, "bpmn:Participant")) {
        directEditing.cancel();
      }
      if (is(e.active.element, "bpmn:Lane")) {
        directEditing.cancel();
      }
    });

    eventBus.on(["element.dblclick", "create.end", "autoPlace.end"], (e) => {
      const element = e.element || e.shape || e.elements[0];
      if (is(element, "bpmn:Participant")) {
        const activity = element.businessObject;
        this._dropdownContainer.currentElement = element;

        const updateRolesSelection = () => {
          this._rolesDropdown
            .getEntries()
            .forEach((entry) =>
              entry.setSelected(activity.roles === entry.option)
            );
        };

        const updateUnitsSelection = () => {
          this._unitsDropdown
            .getEntries()
            .forEach((entry) =>
              entry.setSelected(activity.units === entry.option)
            );
        };

        const updateOrgResourcesSelection = () => {
          this._orgResourcesDropdown
            .getEntries()
            .forEach((entry) =>
              entry.setSelected(activity.orgResources === entry.option)
            );
        };

        const populateRolesDropdown = () => {
          this._rolesDropdown.populate(
            this._fragmentModeler._roles || [],
            (roles, element) => {
              this.updateRoles(roles, element);
              if (element.businessObject.roles === undefined) {
              }
              updateRolesSelection();
            },
            element
          );
          this._rolesDropdown.addCreateElementInput((event) =>
            this._dropdownContainer.confirm()
          );
          updateRolesSelection();
        };

        const populateUnitsDropdown = () => {
          this._unitsDropdown.populate(
            this._fragmentModeler._units || [],
            (units, element) => {
              this.updateUnits(units, element);
              if (element.businessObject.units === undefined) {
              }
              updateUnitsSelection();
            },
            element
          );
          this._unitsDropdown.addCreateElementInput((event) =>
            this._dropdownContainer.confirm()
          );
          updateUnitsSelection();
        };

        const populateOrgResourcesDropdown = () => {
          this._orgResourcesDropdown.populate(
            this._fragmentModeler._orgResources || [],
            (orgResources, element) => {
              this.updateOrgResources(orgResources, element);
              if (element.businessObject.orgResources === undefined) {
              }
              updateOrgResourcesSelection();
            },
            element
          );
          this._orgResourcesDropdown.addCreateElementInput((event) =>
            this._dropdownContainer.confirm()
          );
          updateOrgResourcesSelection();
        };

        populateRolesDropdown();
        populateUnitsDropdown();
        populateOrgResourcesDropdown();

        this._dropdownContainer.confirm = (event) => {
          const newRoleInput = this._rolesDropdown.getInputValue().trim();
          const newUnitInput = this._unitsDropdown.getInputValue().trim();
          const newOrgResourceInput = this._orgResourcesDropdown
            .getInputValue()
            .trim();

          if (newRoleInput !== "" && newRoleInput !== activity.roles) {
            let newRole = this.createRole(newRoleInput);
            this.updateRoles(newRole, element);
            populateRolesDropdown();
          }

          if (newUnitInput !== "" && newUnitInput !== activity.units) {
            let newUnit = this.createUnit(newUnitInput);
            this.updateUnits(newUnit, element);
            populateUnitsDropdown();
          }

          if (
            newOrgResourceInput !== "" &&
            newOrgResourceInput !== activity.orgResources
          ) {
            let newResource = this.createOrgResource(newOrgResourceInput);
            this.updateOrgResources(newResource, element);
            populateOrgResourcesDropdown();
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
            this._unitsDropdown.clearInput();
            this._orgResourcesDropdown.clearInput();
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

      if (is(element, "bpmn:Lane")) {
        const activity = element.businessObject;
        this._dropdownContainer.currentElement = element;

        const updateRolesSelection = () => {
          this._rolesDropdown
            .getEntries()
            .forEach((entry) =>
              entry.setSelected(activity.roles === entry.option)
            );
        };

        const updateUnitsSelection = () => {
          this._unitsDropdown
            .getEntries()
            .forEach((entry) =>
              entry.setSelected(activity.units === entry.option)
            );
        };

        const updateOrgResourcesSelection = () => {
          this._orgResourcesDropdown
            .getEntries()
            .forEach((entry) =>
              entry.setSelected(activity.orgResources === entry.option)
            );
        };

        const populateRolesDropdown = () => {
          this._rolesDropdown.populate(
            this._fragmentModeler._roles || [],
            (roles, element) => {
              this.updateRoles(roles, element);
              if (element.businessObject.roles === undefined) {
              }
              updateRolesSelection();
            },
            element
          );
          this._rolesDropdown.addCreateElementInput((event) =>
            this._dropdownContainer.confirm()
          );
          updateRolesSelection();
        };

        const populateUnitsDropdown = () => {
          this._unitsDropdown.populate(
            this._fragmentModeler._units || [],
            (units, element) => {
              this.updateUnits(units, element);
              if (element.businessObject.units === undefined) {
              }
              updateUnitsSelection();
            },
            element
          );
          this._unitsDropdown.addCreateElementInput((event) =>
            this._dropdownContainer.confirm()
          );
          updateUnitsSelection();
        };

        const populateOrgResourcesDropdown = () => {
          this._orgResourcesDropdown.populate(
            this._fragmentModeler._orgResources || [],
            (orgResources, element) => {
              this.updateOrgResources(orgResources, element);
              if (element.businessObject.orgResources === undefined) {
              }
              updateOrgResourcesSelection();
            },
            element
          );
          this._orgResourcesDropdown.addCreateElementInput((event) =>
            this._dropdownContainer.confirm()
          );
          updateOrgResourcesSelection();
        };

        populateRolesDropdown();
        populateUnitsDropdown();
        populateOrgResourcesDropdown();

        this._dropdownContainer.confirm = (event) => {
          const newRoleInput = this._rolesDropdown.getInputValue().trim();
          const newUnitInput = this._unitsDropdown.getInputValue().trim();
          const newOrgResourceInput = this._orgResourcesDropdown
            .getInputValue()
            .trim();

          if (newRoleInput !== "" && newRoleInput !== activity.roles) {
            let newRole = this.createRole(newRoleInput);
            this.updateRoles(newRole, element);
            populateRolesDropdown();
          }

          if (newUnitInput !== "" && newUnitInput !== activity.units) {
            let newUnit = this.createUnit(newUnitInput);
            this.updateUnits(newUnit, element);
            populateUnitsDropdown();
          }

          if (
            newOrgResourceInput !== "" &&
            newOrgResourceInput !== activity.orgResources
          ) {
            let newResource = this.createOrgResource(newOrgResourceInput);
            this.updateOrgResources(newResource, element);
            populateOrgResourcesDropdown();
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
            this._unitsDropdown.clearInput();
            this._orgResourcesDropdown.clearInput();
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

  createRole(name) {
    return this._eventBus.fire(CommonEvents.ROLE_CREATION_REQUESTED, {
      name,
    });
  }

  updateRoles(newRole, element) {
    const fmObject = element.businessObject;
    if (fmObject.roles === newRole) {
      fmObject.roles = undefined;
    } else {
      fmObject.roles = newRole;
    }
    this._eventBus.fire("element.changed", {
      element,
    });
  }

  createUnit(name) {
    return this._eventBus.fire(CommonEvents.UNIT_CREATION_REQUESTED, {
      name,
    });
  }

  updateUnits(newUnit, element) {
    const fmObject = element.businessObject;
    if (fmObject.units === newUnit) {
      fmObject.units = undefined;
    } else {
      fmObject.units = newUnit;
    }
    this._eventBus.fire("element.changed", {
      element,
    });
  }

  createOrgResource(name) {
    return this._eventBus.fire(CommonEvents.ORGRESOURCE_CREATION_REQUESTED, {
      name,
    });
  }

  updateOrgResources(newOrgResource, element) {
    const fmObject = element.businessObject;
    if (fmObject.orgResources === newOrgResource) {
      fmObject.orgResources = undefined;
    } else {
      fmObject.orgResources = newOrgResource;
    }
    this._eventBus.fire("element.changed", {
      element,
    });
  }
}

LaneLabelHandler.$inject = [
  "eventBus",
  "modeling",
  "directEditing",
  "overlays",
  "fragmentModeler",
];
