import {
    attr as domAttr,
    classes as domClasses,
    event as domEvent,
    query as domQuery
} from 'min-dom';

import getDropdown from '../../util/Dropdown';
import {download, upload} from '../../util/FileUtil';

import OlcEvents from '../OlcEvents';

export default function OlcButtonBar(canvas, eventBus, olcModeler) {
    var container = canvas.getContainer().parentElement;
    var buttonBar = document.createElement('div');
    domClasses(buttonBar).add('olc-buttonbar');
    container.appendChild(buttonBar);

    // Import export buttons (disabled)

    const exportButton = document.createElement('button');
    exportButton.innerHTML = 'Export Olc as Xml'
    exportButton.addEventListener('click', function () {
        olcModeler.saveXML({ format: true }).then(result => {
            download('foobar.xml', result.xml);
        });
    });
    // buttonBar.appendChild(exportButton);
    const importButton = document.createElement('button');
    importButton.innerHTML = 'Import Olc from Xml'
    importButton.addEventListener('click', function () {
        upload(xml => olcModeler.importXML(xml));
    });
    // buttonBar.appendChild(importButton);

    // Select olc Menu    
    var selectOlcComponent = document.createElement('div');
    selectOlcComponent.classList.add('olc-select-component');
    var selectedOlcSpan = document.createElement('span');
    selectedOlcSpan.style.userSelect = 'none';
    selectOlcComponent.showValue = function (olc) {
        this.value = olc;
        selectedOlcSpan.innerText = this.value ?
            this.value.classRef.name
            : '<no OLC selected>';
    }
    var selectOlcMenu = getDropdown();
    selectOlcComponent.addEventListener('click', event => {
        if (event.target === selectOlcComponent || event.target === selectedOlcSpan) {
            repopulate();
            selectOlcMenu.style.display = 'block';
        } else {
            return;
        }
    });
    selectOlcComponent.addEventListener('dblclick', event => {
        if (selectOlcComponent.value && (event.target === selectOlcComponent || event.target === selectedOlcSpan)) {
            hideSelectOlcMenu();
            var renameOlcInput = document.createElement('input');
            renameOlcInput.value = selectOlcComponent.value.classRef.name;
            renameOlcInput.addEventListener("change", function (event) {
                renameOlcInput.blur();
                eventBus.fire(OlcEvents.OLC_RENAME, {
                    olc: selectOlcComponent.value,
                    name: renameOlcInput.value
                });
            });
            renameOlcInput.addEventListener("focusout", function (event) {
                selectOlcComponent.replaceChild(selectedOlcSpan, renameOlcInput);
            });

            selectOlcComponent.replaceChild(renameOlcInput, selectedOlcSpan);
            //Timeout because focus is immediately lost if set immediately
            setTimeout(() => renameOlcInput.focus(), 100);
        } else {
            return;
        }
    });
    selectOlcComponent.appendChild(selectedOlcSpan);
    selectOlcComponent.appendChild(selectOlcMenu);
    buttonBar.appendChild(selectOlcComponent);

    // Delete olc button
    var deleteOlcButton = document.createElement('button');
    deleteOlcButton.innerHTML = '🗑️';
    deleteOlcButton.title = 'Delete Current Olc';
    deleteOlcButton.addEventListener('click', () => {
        var olcToDelete = selectOlcComponent.value;
        var shouldDelete = eventBus.fire(OlcEvents.OLC_DELETION_REQUESTED, { olc: olcToDelete });
        if (shouldDelete !== false) {
            // Deletion was not rejected and not handled somewhere else; should not happen when mediator is involved
            olcModeler.deleteOlc(olcToDelete.classRef);
        }
    });
    buttonBar.appendChild(deleteOlcButton);

    function repopulate() {
        var olcs = olcModeler.getOlcs();
        var valueBefore = selectOlcComponent.value;
        selectOlcMenu.populate(olcs, olc => {
            olcModeler.showOlc(olc);
            hideSelectOlcMenu();
        });
        selectOlcMenu.addCreateElementInput(event => {
            var className = event.target.value;
            eventBus.fire(OlcEvents.DATACLASS_CREATION_REQUESTED, {
                name: className
            });
        });
        deleteOlcButton.disabled = olcs.length === 0;
        selectOlcComponent.showValue(valueBefore);
    }

    function hideSelectOlcMenu() {
        selectOlcMenu.innerHTML = '';
        selectOlcMenu.style.display = 'none';
    }

    eventBus.on([OlcEvents.DEFINITIONS_CHANGED], event => repopulate());
    eventBus.on([OlcEvents.SELECTED_OLC_CHANGED], event => selectOlcComponent.showValue(event.olc));
    eventBus.on('element.click', event => hideSelectOlcMenu())

}

OlcButtonBar.$inject = [
    'canvas',
    'eventBus',
    'olcModeler'
];
