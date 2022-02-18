import FragmentModeler from './lib/fragmentmodeler/FragmentModeler';
import diagramXML from '../resources/newDiagram.bpmn';
import datamodelXML from '../resources/sampleBoard.bpmn';
import newDatamodel from '../resources/emptyBoard.bpmn';
import OlcModeler from './lib/olcmodeler/OlcModeler';
import GoalStateModeler from './lib/goalstatemodeler/GoalStateModeler';
import DataModelModeler from './lib/datamodelmodeler/Modeler';
import DummyData from './DummyData';

import $ from 'jquery';
import Mediator from './lib/mediator/Mediator';
import Checker from './lib/guidelines/Checker';
import ErrorBar from './lib/guidelines/ErrorBar';
import { download } from './lib/util/FileUtil';

import conferenceProcess from '../resources/conferenceModel/process.bpmn';
import conferenceDataModel from '../resources/conferenceModel/datamodel.xml';
import conferenceOLC from '../resources/conferenceModel/olc.xml';

const LOAD_DUMMY = true;


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
  // TODO dummy fragment data
  await dataModeler.importXML(conferenceDataModel);
  await olcModeler.importXML(conferenceOLC);
  await fragmentModeler.importXML(conferenceProcess);
  // DummyData.dummyStateList.forEach(clazz => {
  //   var clazzRef = dataModeler.get('elementRegistry').get(clazz.id).businessObject;
  //   olcModeler.addOlc(clazzRef);
  //   // AddOlc Also implies that this olc is then selected
  //   var canvas = olcModeler.get('canvas');
  //   var diagramRoot = canvas.getRootElement();
  //   for (var i = 0; i < clazz.states.length; i++) {
  //     var state = clazz.states[i];
  //     var attrs = {
  //       type: 'olc:State',
  //       id: state.id,
  //       name: state.name,
  //       x: (i+2) * 100,
  //       y: 100
  //     };
  //     var stateVisual = olcModeler.get('elementFactory').createShape(attrs);
  //     diagramRoot.businessObject.get('Elements').push(stateVisual.businessObject);
  //     stateVisual.businessObject.$parent = diagramRoot.businessObject;
  //     canvas.addShape(stateVisual, diagramRoot);
  //   }
  // });
  // goalStateModeler.showGoalState(DummyData.dummyGoalState(olcModeler._definitions.olcs));
}

async function createNewDiagram() {
    try {
        // await fragmentModeler.importXML(xml);
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

Array.from(document.getElementsByClassName("focusHeader")).forEach(button => button.addEventListener("click", function(event) { toggleFocusModeler(event.target) }, false));

function toggleFocusModeler(button) {
    if (!button.parentElement.classList.contains("focus")){
        // get wrapper for element on right side
        var element_to_focus = button.parentElement.parentElement;
        focus(element_to_focus);
    }
}

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
