import {
    attr as domAttr,
    classes as domClasses,
    event as domEvent,
    query as domQuery
} from 'min-dom';

import OlcEvents from '../OlcEvents';

export default function OlcButtonBar(canvas, eventBus, olcModeler) {
    var container = canvas.getContainer();
    var buttonBar = document.createElement('div');
    domClasses(buttonBar).add('olc-buttonbar');
    container.appendChild(buttonBar);

    var selectOlcMenu = document.createElement('select');
    selectOlcMenu.addEventListener('change', event => {
        if(selectOlcMenu.value) {
            olcModeler.showOlcById(selectOlcMenu.value);
        }
    });
    buttonBar.appendChild(selectOlcMenu);

    function repopulate(olcs) {
        for(var i = 0; i < olcs.length; i++) {
            selectOlcMenu.options[i] = new Option(olcs[i].get('name'), olcs[i].get('id'));
        }
    }

    eventBus.on([OlcEvents.DEFINITIONS_CHANGED], event => repopulate(event.definitions.olcs));
    eventBus.on([OlcEvents.SELECTED_OLC_CHANGED], event => selectOlcMenu.value = event.olc.get('id'));
}

OlcButtonBar.$inject = [
    'canvas',
    'eventBus',
    'olcModeler'
];
