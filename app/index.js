import FragmentModeler from "./lib/fragmentmodeler/FragmentModeler";
import diagramXML from "../resources/newDiagram.bpmn";
import newDatamodel from "../resources/emptyBoard.bpmn";
import OlcModeler from "./lib/olcmodeler/OlcModeler";
import TerminationConditionModeler from "./lib/terminationconditionmodeler/TerminationConditionModeler";
import DataModelModeler from "./lib/datamodelmodeler/Modeler";
import ObjectiveModeler from "./lib/objectivemodeler/OmModeler";
import DependencyModeler from "./lib/dependencymodeler/DependencyModeler";
import RoleModeler from "./lib/rolemodeler/RoleModeler";
import RemModeler from "./lib/resourcemodeler/RemModeler";

import $ from "jquery";
import Mediator from "./lib/mediator/Mediator";
import Checker from "./lib/guidelines/Checker";
import ErrorBar from "./lib/guidelines/ErrorBar";
import { download, upload } from "./lib/util/FileUtil";
import getDropdown from "./lib/util/Dropdown";
import { classes as domClasses } from "min-dom";

import conferenceProcess from "../resources/conferenceModel/process.bpmn";
import conferenceDataModel from "../resources/conferenceModel/datamodel.xml";
import conferenceOLC from "../resources/conferenceModel/olc.xml";
import conferenceTerminationCondition from "../resources/conferenceModel/terminationCondition.xml";

import Zip from "jszip";
import { appendOverlayListeners } from "./lib/util/HtmlUtil";

import { exportExecutionPlan } from "../dist/excelExporter/ExcelExporter.js";
import { ModelObjectParser } from "../planner/parser/ModelObjectParser";

const constructionMode = true; // Set to true for renaming modelers for user study and removing termination condition modeler
const LOAD_DUMMY = false; // Set to true to load conference example data
const SHOW_DEBUG_BUTTONS = false; // Set to true to show additional buttons for debugging

var mediator = new Mediator();
window.mediator = mediator;

var olcModeler = new OlcModeler({
  container: document.querySelector("#olc-canvas"),
  keyboard: {
    bindTo: document.querySelector("#olc-canvas"),
  },
  additionalModules: [
    {
      __init__: ["mediator"],
      mediator: ["type", mediator.OlcModelerHook],
    },
  ],
});

var dependencyModeler = new DependencyModeler({
  container: document.querySelector("#dependencymodel-canvas"),
  keyboard: {
    bindTo: document.querySelector("#dependencymodel-canvas"),
  },
  additionalModules: [
    {
      __init__: ["mediator"],
      mediator: ["type", mediator.DependencyModelerHook],
    },
  ],
});

var dataModeler = new DataModelModeler({
  container: "#datamodel-canvas",
  keyboard: {
    bindTo: document.querySelector("#datamodel-canvas"),
  },
  additionalModules: [
    {
      __init__: ["mediator"],
      mediator: ["type", mediator.DataModelerHook],
    },
  ],
});

var objectiveModeler = new ObjectiveModeler({
  container: "#objectivemodel-canvas",
  keyboard: {
    bindTo: document.querySelector("#objectivemodel-canvas"),
  },
  additionalModules: [
    {
      __init__: ["mediator"],
      mediator: ["type", mediator.ObjectiveModelerHook],
    },
  ],
});

var fragmentModeler = new FragmentModeler({
  container: "#fragments-canvas",
  keyboard: { bindTo: document.querySelector("#fragments-canvas") },
  additionalModules: [
    {
      __init__: ["mediator"],
      mediator: ["type", mediator.FragmentModelerHook],
    },
  ],
});

var roleModeler = new RoleModeler({
  container: "#rolemodel-canvas",
  keyboard: { bindTo: document.querySelector("#rolemodel-canvas") },
  additionalModules: [
    {
      __init__: ["mediator"],
      mediator: ["type", mediator.RoleModelerHook],
    },
  ],
});

var resourceModeler = new RemModeler({
  container: "#resourcemodel-canvas",
  keyboard: {
    bindTo: document.querySelector("#resourcemodel-canvas"),
  },
  additionalModules: [
    {
      __init__: ["mediator"],
      mediator: ["type", mediator.ResourceModelerHook],
    },
  ],
});

var terminationConditionModeler = new TerminationConditionModeler(
  "#terminationcondition-canvas"
);
new mediator.TerminationConditionModelerHook(terminationConditionModeler);

const errorBar = new ErrorBar(document.getElementById("errorBar"), mediator);
const checker = new Checker(mediator, errorBar);
var currentModeler = fragmentModeler;

mediator.getModelers().forEach((modeler) => {
  var header = document.getElementById("title" + modeler.id);
  header.innerHTML = modeler.name(constructionMode);
});

async function loadDebugData() {
  const zip = new Zip();
  zip.file("fragments.bpmn", conferenceProcess);
  zip.file("dataModel.xml", conferenceDataModel);
  zip.file("olcs.xml", conferenceOLC);
  zip.file("terminationCondition.xml", conferenceTerminationCondition);
  await importFromZip(zip.generateAsync({ type: "base64" }));
}

async function createNewDiagram() {
  try {
    checker.deactivate();
    await dependencyModeler.createNew();
    await fragmentModeler.importXML(diagramXML);
    await olcModeler.createNew();
    await dataModeler.importXML(newDatamodel);
    await roleModeler.createDiagram();
    await resourceModeler.createDiagram();
    await objectiveModeler.createDiagram();
    terminationConditionModeler.createNew();
    if (LOAD_DUMMY) {
      await loadDebugData();
    }
    checker.activate();
  } catch (err) {
    console.error(err);
  }
}

$(function () {
  createNewDiagram();
});

// expose modeler to window for debugging purposes
window.modeler = olcModeler;

// Focus follows mouse to not send commands to all modelers all the time
Array.from(document.getElementsByClassName("canvas")).forEach((element) => {
  element.tabIndex = 0;
  element.addEventListener("mouseenter", (event) => {
    element.focus();
  });
});

async function exportToZip() {
  const zip = new Zip();
  const fragments = (await fragmentModeler.saveXML({ format: true })).xml;
  zip.file("fragments.bpmn", fragments);
  const dataModel = (await dataModeler.saveXML({ format: true })).xml;
  zip.file("dataModel.xml", dataModel);
  const objectiveModel = (await objectiveModeler.saveXML({ format: true })).xml;
  zip.file("objectiveModel.xml", objectiveModel);
  const olcs = (await olcModeler.saveXML({ format: true })).xml;
  zip.file("olcs.xml", olcs);
  const resourceModel = (await resourceModeler.saveXML({ format: true })).xml;
  zip.file("resourceModel.xml", resourceModel);
  const terminationCondition = (
    await terminationConditionModeler.saveXML({ format: true })
  ).xml;
  zip.file("terminationCondition.xml", terminationCondition);
  const dependencyModel = (await dependencyModeler.saveXML({ format: true }))
    .xml;
  zip.file("dependencyModel.xml", dependencyModel);
  const roleModel = (await roleModeler.saveXML({ format: true })).xml;
  zip.file("roleModel.xml", roleModel);
  return zip.generateAsync({ type: "base64" });
}

async function importFromZip(zipData) {
  checker.deactivate();
  const zip = await Zip.loadAsync(zipData, { base64: true });
  const files = {
    fragments: zip.file("fragments.bpmn"),
    dataModel: zip.file("dataModel.xml"),
    objectiveModel: zip.file("objectiveModel.xml"),
    olcs: zip.file("olcs.xml"),
    terminationCondition: zip.file("terminationCondition.xml"),
    dependencyModel: zip.file("dependencyModel.xml"),
    resourceModel: zip.file("resourceModel.xml"),
    roleModel: zip.file("roleModel.xml"),
  };
  Object.keys(files).forEach((key) => {
    if (!files[key]) {
      throw new Error("Missing file: " + key);
    }
  });
  await dependencyModeler.importXML(
    await files.dependencyModel.async("string")
  );
  await dataModeler.importXML(await files.dataModel.async("string"));
  await roleModeler.importXML(await files.roleModel.async("string"));
  await olcModeler.importXML(await files.olcs.async("string"));
  await fragmentModeler.importXML(await files.fragments.async("string"));
  await terminationConditionModeler.importXML(
    await files.terminationCondition.async("string")
  );
  await objectiveModeler.importXML(await files.objectiveModel.async("string"));
  await resourceModeler.importXML(await files.resourceModel.async("string"));
  checker.activate();
}

// export async function planButtonAction() {
//     const modelObjectParser = new ModelObjectParser(dataModeler, fragmentModeler, objectiveModeler, dependencyModeler, roleModeler, resourceModeler);
//     const planner = modelObjectParser.createPlanner();
//     let executionLog = planner.generatePlan();
//     let blob = await exportExecutionPlan(executionLog);

//     const url = window.URL.createObjectURL(blob);

//     // Create a link element
//     const link = document.createElement('a');
//     link.href = url;
//     link.download = 'Execution Plan.xlsx';

//     // Programmatically click the link to initiate the download
//     link.click();

//     // Clean up the temporary URL
//     window.URL.revokeObjectURL(url);
// }

// IO Buttons
document.getElementById("newButton").addEventListener("click", () => {
  createNewDiagram();
  displayFileName("Unnamed file");
});

document.getElementById("openButton").addEventListener("click", () =>
  upload((data, title) => {
    if (data.startsWith("data:")) {
      data = data.split(",")[1];
    }
    importFromZip(data);
    displayFileName(title);
  }, "base64")
);

document.getElementById("saveButton").addEventListener("click", () =>
  exportToZip().then((zip) => {
    download("fcmModel.zip", zip, "base64");
  })
);

async function displayFileName(zipName) {
  document.getElementById("fileName").innerHTML = zipName;
}

// document.getElementById("planningButton").addEventListener("click", () => {
//   planButtonAction();
// });

async function navigationDropdown() {
  var container = document.getElementById("navigationBar");
  var buttonBar = document.createElement("div");
  domClasses(buttonBar).add("olc-buttonbar");
  domClasses(buttonBar).add("barContent");
  container.appendChild(buttonBar);

  // Select olc Menu
  var selectOlcComponent = document.createElement("div");
  selectOlcComponent.classList.add("olc-select-component");
  var selectedOlcSpan = document.createElement("span");
  selectedOlcSpan.style.userSelect = "none";
  selectOlcComponent.showValue = function (modeler) {
    this.value = modeler;
    selectedOlcSpan.innerText = this.value.name(constructionMode)
      ? this.value.name(constructionMode)
      : "buggy";
  };
  var selectOlcMenu = getDropdown();
  selectOlcComponent.addEventListener("click", (event) => {
    if (
      event.target === selectOlcComponent ||
      event.target === selectedOlcSpan
    ) {
      repopulateDropdown();
      showSelectOlcMenu();
    }
  });

  selectOlcMenu.handleClick = (event) => {
    return selectOlcMenu.contains(event.target);
  };

  function repopulateDropdown() {
    var modelers = mediator.getModelers();
    modelers.sort((a, b) => {
      return a.rank - b.rank;
    });
    if (constructionMode) {
      modelers = modelers.filter(
        (object) =>
          object !== resourceModeler &&
          object !== terminationConditionModeler &&
          object !== dependencyModeler &&
          object !== dataModeler &&
          object !== olcModeler &&
          object !== objectiveModeler
      );
    }

    var valueBefore = selectOlcComponent.value;
    selectOlcMenu.populate(
      modelers,
      (modeler) => {
        showModeler(modeler);
        selectOlcComponent.showValue(modeler);
        selectOlcMenu.hide();
      },
      undefined,
      (modeler) => modeler.name(constructionMode)
    );
    selectOlcComponent.showValue(valueBefore);
  }

  function showModeler(modeler) {
    if (modeler === terminationConditionModeler) {
      focus(modeler._root.closest(".canvas"));
    } else {
      focus(modeler.get("canvas")._container.closest(".canvas"));
    }
  }

  function showSelectOlcMenu() {
    const closeOverlay = appendOverlayListeners(selectOlcMenu);
    selectOlcMenu.style.display = "block";
    selectOlcComponent.appendChild(selectOlcMenu);
    selectOlcMenu.hide = closeOverlay;
  }

  selectOlcComponent.showValue(currentModeler);
  selectOlcComponent.appendChild(selectedOlcSpan);
  buttonBar.appendChild(selectOlcComponent);
}

navigationDropdown();

if (SHOW_DEBUG_BUTTONS) {
  const reloadButton = document.createElement("a");
  reloadButton.classList.add("barButton");
  reloadButton.classList.add("barContent");
  reloadButton.innerHTML = "reload";
  document.getElementById("saveButton").parentElement.appendChild(reloadButton);
  reloadButton.addEventListener("click", () =>
    exportToZip().then((zip) => {
      importFromZip(zip);
    })
  );
}

// functions to make the note area draggable

//Make the DIV element draggagle:
dragElement(document.getElementById("note-area-wrapper"));

function dragElement(elmnt) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  document.getElementById("note-area-drag").onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// function to toggle the note Area

document
  .getElementById("noteAreaToggleButton")
  .addEventListener("click", toggleNoteArea, false);

document
  .getElementById("note-area-close")
  .addEventListener("click", toggleNoteArea, false);

function toggleNoteArea() {
  var noteArea = document.getElementById("note-area-wrapper");

  if (noteArea.classList.contains("hidden") == true) {
    noteArea.classList.remove("hidden");
  } else {
    noteArea.classList.add("hidden");
  }
}

// function to toggle focus

Array.from(document.getElementsByClassName("focusHeader")).forEach((button) =>
  button.addEventListener(
    "click",
    function (event) {
      focus(event.target.closest(".canvas"));
    },
    false
  )
);

function focus(element) {
  // get wrapper for element on left side
  var currentlyFocussedElement = document.getElementsByClassName("focus")[0];

  if (element !== currentlyFocussedElement) {
    // canvas on right side add class focus

    element.classList.remove("hidden");
    element.classList.add("focus");

    // remove focus from canvas on left side
    currentlyFocussedElement.classList.remove("focus");
    currentlyFocussedElement.classList.add("hidden");
  }
}

// TODO move full focus function to mediator
mediator.focus = function (modeler) {
  focus(modeler.get("canvas").getContainer().closest(".canvas"));
};
// document.getElementById("toggleDatamodel").click(); //TODO only for debug reasons

window.mediator = mediator;
window.export = function (modeler) {
  modeler.saveXML({ format: true }).then((result) => {
    download("foobar.xml", result.xml);
  });
};

window.checker = checker;
