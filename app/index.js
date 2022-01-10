import FragmentModeler from './lib/fragmentmodeler/FragmentModeler';
import diagramXML from '../resources/newDiagram.bpmn';
import datamodelXML from '../resources/sampleBoard.bpmn';
import OlcModeler from './lib/olcmodeler/OlcModeler';
import GoalStateModeler from './lib/goalstatemodeler/GoalStateModeler';
import DataModelModeler from './lib/datamodelmodeler/Modeler';
import { dummyGoalState } from './lib/goalstatemodeler/GoalStateModeler';

import $ from 'jquery';



function download(name, data) {
  var encodedData = encodeURIComponent(data);
  var link = document.createElement("a");
  document.body.appendChild(link);

  $(link).attr({
    'href': 'data:application/xml;charset=UTF-8,' + encodedData,
    'download': name
  });

  link.click();
  document.body.removeChild(link);
}

function upload(callback) {
  var fileInput = document.createElement("input");
  document.body.appendChild(fileInput);

  $(fileInput).attr({'type' : 'file'}).on('change', function(e) {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = function (evt) {
      callback(evt.target.result);
    }
  }).trigger('click');

  document.body.removeChild(fileInput);
}


var olcModeler = new OlcModeler({
    container: document.querySelector('#olc-canvas')
});

function foo() {
  
  const canvas = olcModeler.get('canvas');
  const elementFactory = olcModeler.get('elementFactory');

  // add root
  var root = canvas.getRootElement();
  console.log(root);

  // add shapes
  var shape1 = elementFactory.createShape({
    type: 'olc:State',
    name: 'State A',
    x: 150,
    y: 100
  });

  canvas.addShape(shape1, root);

  var shape2 = elementFactory.createShape({
    type: 'olc:State',
    name: 'State B',
    x: 290,
    y: 220
  });

  canvas.addShape(shape2, root);


  var connection1 = elementFactory.createConnection({
    type: 'olc:Transition',
    waypoints: [
      { x: 250, y: 180 },
      { x: 290, y: 220 }
    ],
    source: shape1,
    target: shape2
  });

  canvas.addConnection(connection1, root);


  // var shape3 = elementFactory.createShape({
  //   x: 450,
  //   y: 80,
  //   width: 100,
  //   height: 80
  // });
  // canvas.addShape(shape3, root);
  // var shape4 = elementFactory.createShape({
  //   x: 425,
  //   y: 50,
  //   width: 300,
  //   height: 200,
  //   isFrame: true
  // });
  // canvas.addShape(shape4, root);
  // // (3) interact with the diagram via API
  // const selection = diagram.get('selection');
  // selection.select(shape3);
}

var dataModeler = new DataModelModeler({
    container: '#datamodel-canvas',
    keyboard: {
        bindTo: window
    }
});

var fragmentModeler = FragmentModeler({
    container: '#fragments-canvas',
    keyboard: { bindTo: document }
});

var goalStatementModeler = new GoalStateModeler(
  '#goalstate-canvas'
);

function createNewDiagram() {
    openDiagram(diagramXML, datamodelXML);
}

async function openDiagram(bpmn_xml, datamodel_xml) {
    try {
        // await fragmentModeler.importXML(xml);
        await fragmentModeler.importXML(bpmn_xml);
        await olcModeler.createNew();
        await dataModeler.importXML(datamodel_xml)
    } catch (err) {
        console.error(err);
    }
}

$(function() {
    createNewDiagram();
    goalStatementModeler.showGoalStatement(dummyGoalState);
});

// expose modeler to window for debugging purposes
window.modeler = olcModeler;


document.getElementById('exportOlc').addEventListener('click', function() {
  olcModeler.saveXML({ format: true }).then(result => {
    download('foobar.xml', result.xml);
  });
});


document.getElementById('importOlc').addEventListener('click', function() {
  upload(xml => olcModeler.importXML(xml));
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

function toggleNoteArea() {

    var noteArea = document.getElementById("note-area-wrapper");
    
    if(noteArea.classList.contains("hidden") == true) {
        noteArea.classList.remove("hidden");
    } else {          
        noteArea.classList.add("hidden");
    }
}


// function to make the error bar expand

