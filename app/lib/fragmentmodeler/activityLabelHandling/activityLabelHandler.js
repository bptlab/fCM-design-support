import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor";
import CommonEvents from "../../common/CommonEvents";
import getDropdown from "../../util/Dropdown";
import { appendOverlayListeners } from "../../util/HtmlUtil";
import { is } from "../../util/Util";

export default class ActivityLabelHandler extends CommandInterceptor {
  constructor(eventBus, modeling, directEditing, overlays, fragmentModeler) {
    super(eventBus);
    this._eventBus = eventBus;
    this._modeling = modeling;
    this._dropdownContainer = document.createElement("div");
    this._dropdownContainer.classList.add("dd-dropdown-multicontainer");
    this._nameDropdown = getDropdown("Name");
    this._dropdownContainer.appendChild(this._nameDropdown);
    this._durationDropdown = getDropdown("Duration");
    this._dropdownContainer.appendChild(this._durationDropdown);
    this._roleDropdown = getDropdown("Role");
    this._dropdownContainer.appendChild(this._roleDropdown);
    this._NoPDropdown = getDropdown("Number Of People");
    this._dropdownContainer.appendChild(this._NoPDropdown);
    this._currentDropdownTarget = undefined;
    this._overlayId = undefined;
    this._overlays = overlays;
    this._fragmentModeler = fragmentModeler;

    eventBus.on("directEditing.activate", function (e) {
      if (is(e.active.element, "bpmn:Task")) {
        directEditing.cancel();
      }
    });

    eventBus.on(["element.dblclick", "create.end", "autoPlace.end"], (e) => {
      const element = e.element || e.shape || e.elements[0];
      if (is(element, "bpmn:Task")) {
        const activity = element.businessObject;
        this._dropdownContainer.currentElement = element;

        const updateRoleSelection = () => {
          this._roleDropdown
            .getEntries()
            .forEach((entry) =>
              entry.setSelected(activity.role === entry.option)
            );
        };

        const populateNameDropdown = () => {
          this._nameDropdown.populate([], () => {}, element);
          this._nameDropdown.addCreateElementInput(
            (event) => this._dropdownContainer.confirm(),
            "text",
            activity.name
          );
        };
        const populateDurationDropdown = () => {
          this._durationDropdown.populate([], () => {}, element);
          this._durationDropdown.addCreateElementInput(
            (event) => this._dropdownContainer.confirm(),
            "number",
            activity.duration,
            "0"
          );
        };
        const populateRoleDropdown = () => {
          this._roleDropdown.populate(
            this._fragmentModeler._roles || [],
            (role, element) => {
              this.updateRole(role, element);
              if (element.businessObject.role === undefined) {
                this._NoPDropdown.clearInput();
              }
              updateRoleSelection();
            },
            element
          );
          this._roleDropdown.addCreateElementInput((event) =>
            this._dropdownContainer.confirm()
          );
          updateRoleSelection();
        };
        const populateNoPDropdown = () => {
          this._NoPDropdown.populate([], () => {}, element);
          this._NoPDropdown.addCreateElementInput(
            (event) => this._dropdownContainer.confirm(),
            "number",
            activity.NoP
          );
        };
        populateNameDropdown();
        populateDurationDropdown();
        populateRoleDropdown();
        populateNoPDropdown();

        this._dropdownContainer.confirm = (event) => {
          const newNameInput = this._nameDropdown.getInputValue().trim();
          const newDurationInput = this._durationDropdown
            .getInputValue()
            .trim();
          const newRoleInput = this._roleDropdown.getInputValue().trim();
          const newNoPInput = this._NoPDropdown.getInputValue().trim();
          if (newNameInput !== "" && newNameInput !== activity.name) {
            this.updateName(newNameInput, element);
            populateNameDropdown();
          }
          if (newDurationInput !== activity.duration && newDurationInput >= 0) {
            this.updateDuration(newDurationInput, element);
            populateDurationDropdown();
          }
          if (newRoleInput !== "" && newRoleInput !== activity.role) {
            let newRole = this.createRole(newRoleInput);
            this.updateRole(newRole, element);
            populateRoleDropdown();
          }
          if (
            newNoPInput !== activity.NoP &&
            newNoPInput > 0 &&
            activity.role !== undefined
          ) {
            this.updateNoP(newNoPInput, element);
            populateNoPDropdown();
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
            this._roleDropdown.clearInput();
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

  updateDuration(newTime, element) {
    element.businessObject.duration = newTime;
    this._eventBus.fire("element.changed", {
      element,
    });
  }

  createRole(name) {
    return this._eventBus.fire(CommonEvents.ROLE_CREATION_REQUESTED, {
      name,
    });
  }

  updateRole(newRole, element) {
    const fmObject = element.businessObject;
    if (fmObject.role === newRole) {
      fmObject.role = undefined;
      fmObject.NoP = undefined;
    } else {
      fmObject.role = newRole;
    }
    this._eventBus.fire("element.changed", {
      element,
    });
  }

  updateNoP(newNoP, element) {
    element.businessObject.NoP = newNoP;
    this._eventBus.fire("element.changed", {
      element,
    });
  }
}

ActivityLabelHandler.$inject = [
  "eventBus",
  "modeling",
  "directEditing",
  "overlays",
  "fragmentModeler",
];
