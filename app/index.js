import BpmnModeler from 'bpmn-js/lib/Modeler';
import diagramXML from '../resources/newDiagram.bpmn';
import $ from 'jquery';

var modeler = new BpmnModeler({
    container: '#canvas'
});

function createNewDiagram() {
    openDiagram(diagramXML);
}

async function openDiagram(xml) {
    try {
        await modeler.importXML(xml);
    } catch (err) {
        console.error(err);
    }
}

$(function() {
    createNewDiagram();
});

// expose bpmnjs to window for debugging purposes
window.bpmnjs = modeler;