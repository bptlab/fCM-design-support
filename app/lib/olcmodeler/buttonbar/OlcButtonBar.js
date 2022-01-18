import {
    attr as domAttr,
    classes as domClasses,
    event as domEvent,
    query as domQuery
} from 'min-dom';

import OlcEvents from '../OlcEvents';

export default function OlcButtonBar(canvas, eventBus, olcModeler) {
    var container = canvas.getContainer().parentElement;
    var buttonBar = document.createElement('div');
    domClasses(buttonBar).add('olc-buttonbar');
    container.appendChild(buttonBar);


    // Select olc Menu
    // TODO allow to change current (class-)name and add new olc from bottom of list -> use unified class list component here?
    var selectOlcMenu = document.createElement('select');
    selectOlcMenu.addEventListener('change', event => {
        if(selectOlcMenu.value) {
            olcModeler.showOlcById(selectOlcMenu.value);
        }
    });
    buttonBar.appendChild(selectOlcMenu);

    // Add olc button
    var addOlcButton = document.createElement('button');
    addOlcButton.innerHTML = '➕';
    //TODO tooltip addOlcButton.innerHTML = 'Add Olc';
    //TODO allow to choose class name from class list
    addOlcButton.addEventListener('click', () => olcModeler.addOlc('foobar'));
    buttonBar.appendChild(addOlcButton);

    // Delete olc button
    var deleteOlcButton = document.createElement('button');
    deleteOlcButton.innerHTML = '🗑️';
    //TODO tooltip deleteOlcButton.innerHTML = 'Delete Current Olc';
    deleteOlcButton.addEventListener('click', () => olcModeler.deleteCurrentOlc());
    buttonBar.appendChild(deleteOlcButton);

    function repopulate(olcs) {
        var valueBefore = selectOlcMenu.value;
        for(var i = 0; i < olcs.length; i++) {
            selectOlcMenu.options[i] = new Option(olcs[i].get('name'), olcs[i].get('id'));
        }
        for(var i = selectOlcMenu.options.length; i > olcs.length; i--) {
            delete selectOlcMenu.remove(i-1);
        }
        deleteOlcButton.disabled = olcs.length === 0;
        selectOlcMenu.value = valueBefore;
    }

    eventBus.on([OlcEvents.DEFINITIONS_CHANGED], event => repopulate(event.definitions.get('olcs')));
    eventBus.on([OlcEvents.SELECTED_OLC_CHANGED], event => selectOlcMenu.value = event.olc && event.olc.get('id'));

}

OlcButtonBar.$inject = [
    'canvas',
    'eventBus',
    'olcModeler'
];
