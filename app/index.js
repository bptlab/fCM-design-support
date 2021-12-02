import BpmnModeler from 'bpmn-js/lib/Modeler';
import diagramXML from '../resources/newDiagram.bpmn';
import $ from 'jquery';

var fragmentModeler = new BpmnModeler({
    container: '#canvas'
});

var dataModeler = new BpmnModeler({
    container: '#secondCanvas'
});

function createNewDiagram() {
    openDiagram(diagramXML);
}

async function openDiagram(xml) {
    try {
        await fragmentModeler.importXML(xml);
        await dataModeler.importXML(xml);
    } catch (err) {
        console.error(err);
    }
}

$(function() {
    createNewDiagram();
});

// expose bpmnjs to window for debugging purposes
window.bpmnjs = fragmentModeler;