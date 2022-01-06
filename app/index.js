import BpmnModeler from 'bpmn-js/lib/Modeler';
import diagramXML from '../resources/newDiagram.bpmn';
import OlcModeler from './lib/olcmodeler/OlcModeler';
import $ from 'jquery';

// var fragmentModeler = new BpmnModeler({
//     container: '#canvas'
// });

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

var dataModeler = new BpmnModeler({
    container: '#datamodel-canvas'
});

function createNewDiagram() {
    openDiagram(diagramXML);
}

async function openDiagram(xml) {
    try {
        // await fragmentModeler.importXML(xml);
        await dataModeler.importXML(xml);
        await olcModeler.createNew();
    } catch (err) {
        console.error(err);
    }
}

$(function() {
    createNewDiagram();
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