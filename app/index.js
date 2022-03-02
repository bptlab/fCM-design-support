import FragmentModeler from './lib/fragmentmodeler/FragmentModeler';
import diagramXML from '../resources/newDiagram.bpmn';
import datamodelXML from '../resources/sampleBoard.bpmn';
import newDatamodel from '../resources/emptyBoard.bpmn';
import OlcModeler from './lib/olcmodeler/OlcModeler';
import GoalStateModeler from './lib/goalstatemodeler/GoalStateModeler';
import DataModelModeler from './lib/datamodelmodeler/Modeler';

import $ from 'jquery';
import Mediator from './lib/mediator/Mediator';
import Checker from './lib/guidelines/Checker';
import ErrorBar from './lib/guidelines/ErrorBar';
import { download, upload } from './lib/util/FileUtil';

import conferenceProcess from '../resources/conferenceModel/process.bpmn';
import conferenceDataModel from '../resources/conferenceModel/datamodel.xml';
import conferenceOLC from '../resources/conferenceModel/olc.xml';
import conferenceGoalState from '../resources/conferenceModel/goalState.xml';

import Zip from 'jszip';

const LOAD_DUMMY = false; // Set to true to load conference example data
const SHOW_DEBUG_BUTTONS = false; // Set to true to show additional buttons for debugging


var mediator = new Mediator();
window.mediator = mediator;

var olcModeler = new OlcModeler({
    container: document.querySelector('#olc-canvas'),
    keyboard: { 
      bindTo: document.querySelector('#olc-canvas') 
    },
    additionalModules: [{
      __init__ : ['mediator'],
      mediator : ['type', mediator.OlcModelerHook]
    }]
});

var dataModeler = new DataModelModeler({
    container: '#datamodel-canvas',
    keyboard: {
        bindTo: document.querySelector('#datamodel-canvas')
    },
    additionalModules: [{
      __init__ : ['mediator'],
      mediator : ['type', mediator.DataModelerHook]
    }]
});

var fragmentModeler = new FragmentModeler({
    container: '#fragments-canvas',
    keyboard: { bindTo: document.querySelector('#fragments-canvas') },
    additionalModules: [{
      __init__ : ['mediator'],
      mediator : ['type', mediator.FragmentModelerHook]
    }]
});

var goalStateModeler = new GoalStateModeler(
  '#goalstate-canvas'
);
new mediator.GoalStateModelerHook(goalStateModeler);



const errorBar = new ErrorBar(document.getElementById("errorBar"), mediator);
const checker = new Checker(mediator, errorBar);


async function loadDebugData() {
  const zip = new Zip();
  zip.file('fragments.bpmn', conferenceProcess);
  zip.file('dataModel.xml', conferenceDataModel);
  zip.file('olcs.xml', conferenceOLC);
  zip.file('goalState.xml', conferenceGoalState);
  await importFromZip(zip.generateAsync({type : 'base64'}));
}

async function createNewDiagram() {
    try {
      checker.deactivate();
      await fragmentModeler.importXML(diagramXML);
      await olcModeler.createNew();
      await dataModeler.importXML(newDatamodel);
      goalStateModeler.createNew();
      if (LOAD_DUMMY) {
        await loadDebugData();
      } 
      checker.activate();
    } catch (err) {
        console.error(err);
    }
}

$(function() {
    createNewDiagram();
});

// expose modeler to window for debugging purposes
window.modeler = olcModeler;


// Focus follows mouse to not send commands to all modelers all the time
Array.from(document.getElementsByClassName("canvas")).forEach(element => {
  element.tabIndex = 0;
  element.addEventListener('mouseenter', event => {
    element.focus();
  });
});

async function exportToZip () {
  const zip = new Zip();
  const fragments = (await fragmentModeler.saveXML({ format: true })).xml;
  zip.file('fragments.bpmn', fragments);
  const dataModel = (await dataModeler.saveXML({ format: true })).xml;
  zip.file('dataModel.xml', dataModel);
  const olcs = (await olcModeler.saveXML({ format: true })).xml;
  zip.file('olcs.xml', olcs);
  const goalState = (await goalStateModeler.saveXML({ format: true })).xml;
  zip.file('goalState.xml', goalState);
  return zip.generateAsync({type : 'base64'});
}

async function importFromZip (zipData) {
  checker.deactivate();
  const zip = await Zip.loadAsync(zipData, {base64 : true});
  const files = {
    fragments: zip.file('fragments.bpmn'),
    dataModel: zip.file('dataModel.xml'),
    olcs: zip.file('olcs.xml'),
    goalState: zip.file('goalState.xml')
  };
  Object.keys(files).forEach(key => {
    if (!files[key]) {
      throw new Error('Missing file: '+key)
    }
  });
  await dataModeler.importXML(await files.dataModel.async("string"));
  await olcModeler.importXML(await files.olcs.async("string"));
  await fragmentModeler.importXML(await files.fragments.async("string"));
  await goalStateModeler.importXML(await files.goalState.async("string"));
  checker.activate();
}

// IO Buttons
document.getElementById('newButton').addEventListener('click', () => {
  createNewDiagram();
});

document.getElementById('openButton').addEventListener('click', () => upload(data => {
  if (data.startsWith('data:')) {
    data = data.split(',')[1];
  }
  importFromZip(data);
}, 'base64'));

document.getElementById('saveButton').addEventListener('click', () => exportToZip().then(zip => {
  download('fcmModel.zip', zip, 'base64');
  //importFromZip(zip);
}));

if (SHOW_DEBUG_BUTTONS) {
  const reloadButton = document.createElement('a');
  reloadButton.classList.add('barButton');
  reloadButton.innerHTML = 'reload';
  document.getElementById('saveButton').parentElement.appendChild(reloadButton); 
  reloadButton.addEventListener('click', () => exportToZip().then(zip => {
    importFromZip(zip);
  }));
}


// functions to make the note area draggable

//Make the DIV element draggagle:
dragElement(document.getElementById("note-area-wrapper"));
function dragElement(elmnt) {
      
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
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
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}


// function to toggle the note Area

document.getElementById("noteAreaToggleButton").addEventListener("click", toggleNoteArea, false)

document.getElementById("note-area-close").addEventListener("click", toggleNoteArea, false)

function toggleNoteArea() {

    var noteArea = document.getElementById("note-area-wrapper");
    
    if(noteArea.classList.contains("hidden") == true) {
        noteArea.classList.remove("hidden");
    } else {          
        noteArea.classList.add("hidden");
    }
}

// function to toggle focus

Array.from(document.getElementsByClassName("focusHeader")).forEach(button => button.addEventListener("click", function(event) { focus(event.target.closest('.canvas')) }, false));

function focus(element) {
  // get wrapper for element on left side
  var currentlyFocussedElement = document.getElementsByClassName("focus")[0];

  if (element !== currentlyFocussedElement) {
    // canvas on right side add class focus
    element.classList.add("focus");

    // remove focus from canvas on left side
    currentlyFocussedElement.classList.remove("focus");
  
    // switch wrappers
    var left_node_to_insert = currentlyFocussedElement.parentElement;
  
    var right_node_to_insert = element.parentElement;
  
    left_node_to_insert.appendChild(element);
  
    right_node_to_insert.appendChild(currentlyFocussedElement);
  }
}

// TODO move full focus function to mediator
mediator.focus = function(modeler) {
  focus(modeler.get('canvas').getContainer().closest('.canvas'));
}
// document.getElementById("toggleDatamodel").click(); //TODO only for debug reasons

window.mediator = mediator;
window.export = function (modeler) {
  modeler.saveXML({ format: true }).then(result => {
    download('foobar.xml', result.xml);
  });
}

window.checker = checker;
