import {
    attr as domAttr,
    classes as domClasses,
    event as domEvent,
    query as domQuery
} from 'min-dom';

import getDropdown from '../../util/Dropdown'

import OlcEvents from '../OlcEvents';

export default function OlcButtonBar(canvas, eventBus, olcModeler) {
    var container = canvas.getContainer().parentElement;
    var buttonBar = document.createElement('div');
    domClasses(buttonBar).add('olc-buttonbar');
    container.appendChild(buttonBar);


    // Select olc Menu
    // TODO allow to change current (class-)name and add new olc from bottom of list -> use unified class list component here?
    
    var selectOlcButton = document.createElement('span');
    selectOlcButton.classList.add('valueDisplay');
    selectOlcButton.showValue = function(olc) {
        this.value = olc;
        this.dataset.value = this.value?.classRef?.name
    }
    var selectOlcMenu = getDropdown();
    selectOlcButton.addEventListener('mousedown', event => {
        if (event.target === selectOlcButton) {
            repopulate(olcModeler.getOlcs());
            selectOlcMenu.style.display = 'block';
        } else {
            return;
        }
    });
    selectOlcButton.appendChild(selectOlcMenu);
    buttonBar.appendChild(selectOlcButton);

    // Add olc button
    var addOlcButton = document.createElement('button');
    addOlcButton.innerHTML = '➕';
    //TODO tooltip addOlcButton.innerHTML = 'Add Olc';
    //TODO allow to choose class name from class list
    addOlcButton.addEventListener('click', () => olcModeler.addOlc('foobar'));
    //TODO buttonBar.appendChild(addOlcButton);

    // Delete olc button
    var deleteOlcButton = document.createElement('button');
    deleteOlcButton.innerHTML = '🗑️';
    //TODO tooltip deleteOlcButton.innerHTML = 'Delete Current Olc';
    deleteOlcButton.addEventListener('click', () => olcModeler.deleteCurrentOlc());
    //TODO buttonBar.appendChild(deleteOlcButton);

    function repopulate(olcs) {
        var valueBefore = selectOlcButton.value;
        selectOlcMenu.populate(olcs, olc => {
            olcModeler.showOlc(olc);
            hideSelectOlcMenu();
        });
        deleteOlcButton.disabled = olcs.length === 0;
        selectOlcButton.showValue(valueBefore);
    }

    function hideSelectOlcMenu() {
        selectOlcMenu.innerHTML = '';
        selectOlcMenu.style.display = 'none';
    }

    eventBus.on([OlcEvents.DEFINITIONS_CHANGED], event => repopulate(event.definitions.get('olcs')));
    eventBus.on([OlcEvents.SELECTED_OLC_CHANGED], event => selectOlcButton.showValue(event.olc));
    eventBus.on('element.click', event => hideSelectOlcMenu())

}

OlcButtonBar.$inject = [
    'canvas',
    'eventBus',
    'olcModeler'
];
