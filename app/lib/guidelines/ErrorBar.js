import {openAsOverlay} from "../util/HtmlUtil";
import {type} from "../util/Util";

//TODO rename to "ViolationBar" or similar, as only one severity is about errors

export default class ErrorBar {
    constructor(element, mediator) {
        this.element = element;
        this.mediator = mediator;
        makeResizable(element);
        this.table = element.querySelector('.errorTable');
        this.toggleTableButton = document.getElementById('toggleErrorTable');
        this.toggleTableButton.addEventListener('click', event => {
            this.toggleTable();
        });
        this.numberOfViolations = document.getElementById('numberOfViolations');
        makeColumnsResizable(this.table);
    }

    clear() {
        while (this.table.rows.length > 1) {
            this.table.deleteRow(1);
        }
        this.numberOfViolations.innerHTML = '';
    }

    displayRow({severity, element, artifact, message, link, quickFixes}) {
        const row = this.table.insertRow(-1);
        row.addEventListener('dblclick', event => {
            this.mediator.focusElement(element);
        });
        row.classList.add(severity.cssClass);
        const severityCell = row.insertCell(-1), messageCell = row.insertCell(-1), linkCell = row.insertCell(-1),
            elementCell = row.insertCell(-1), artifactCell = row.insertCell(-1);
        severityCell.classList.add('narrowColumn');
        elementCell.innerHTML = type(element) + ' \"' + element.name + '\"';
        artifactCell.innerHTML = artifact;
        messageCell.innerHTML = message;
        const linkElement = makeGuidelineLink(link);
        linkCell.classList.add('narrowColumn');
        linkCell.appendChild(linkElement);
        if (quickFixes && quickFixes.length > 0) {
            const quickFixesButton = document.createElement('button');
            quickFixesButton.innerHTML = '💡';
            quickFixesButton.style.border = 'none';
            quickFixesButton.style.backgroundColor = 'transparent';
            messageCell.appendChild(quickFixesButton);
            quickFixesButton.addEventListener('click', event => {
                event.stopPropagation();
                const quickFixDiv = makeQuickFixDiv(quickFixes, () => {
                    this.mediator.focusElement(element);
                });
                openAsOverlay(quickFixDiv, event);
            });
            quickFixesButton.addEventListener('dblclick', event => {
                event.stopPropagation();
            });
        }
    }

    toggleTable() {
        this.element.classList.toggle('hidingTable');
    }

    displayNumberOfViolations(severity, number) {
        const display = document.createElement('span');
        display.innerHTML = severity.label + ': ' + number;
        display.classList.add('barButton');
        display.classList.add('barContent');
        this.numberOfViolations.appendChild(display);
        return display;
    }
}

export function makeGuidelineLink(link) {
    const linkElement = document.createElement('a');
    linkElement.href = link;
    linkElement.target = '_blank';
    linkElement.innerHTML = '❓';
    return linkElement;
}

export function makeQuickFixDiv(quickFixes, onFix = () => {
}) {
    const quickFixDiv = document.createElement('div');
    quickFixDiv.classList.add("quickFixDiv");

    const quickFixTable = document.createElement('table');
    quickFixes.forEach(quickFix => {
        const quickFixRow = quickFixTable.insertRow(-1);
        quickFixRow.style.borderBottom = '0px';
        const cell = quickFixRow.insertCell(-1);
//        cell.classList.add('dd-dropdown-entry');
        cell.classList.add('quickFixCell');
        cell.style.padding = '3px';
        cell.style.color = '#29487D';
        cell.innerHTML = quickFix.label;
        cell.addEventListener('click', event => {
            onFix(quickFix);
            quickFix.action(event);
            event.stopPropagation();
        });
        cell.style.cursor = 'pointer';
    });
    quickFixTable.classList.add('errorTable');
    quickFixTable.style.margin = '0';
    quickFixTable.style.width = '100%';
    quickFixDiv.appendChild(quickFixTable);

    return quickFixDiv;
}


function makeResizable(elmnt) {
    // TODO now we have two kinds of code for resizing: dividers and this here
    addDragListener(elmnt, (dx, dy) => {
        elmnt.style.height = elmnt.offsetHeight - dy + "px";
    });
}

function addDragListener(element, callback) {
    var deltaX = 0, deltaY = 0, currentX = 0, currentY = 0;

    element.addEventListener('mousedown', dragMouseDown);

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();

        // get the mouse cursor position at startup:
        currentX = e.clientX;
        currentY = e.clientY;
        // stop listening when mouse is released
        document.addEventListener('mouseup', closeDragElement);
        // call a function whenever the cursor moves:
        document.addEventListener('mousemove', elementDrag);
    }

    function elementDrag(e) {
        if (element.classList.contains('hidingTable')) return;

        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        deltaX = e.clientX - currentX;
        deltaY = e.clientY - currentY;
        currentX = e.clientX;
        currentY = e.clientY;
        callback(deltaX, deltaY);
    }

    function closeDragElement() {
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('mousemove', elementDrag);
    }
}


function makeColumnsResizable(table) {
    const row = table.getElementsByTagName('tr')[0],
        cols = row?.children;

    for (let i = 0; i < cols.length - 1; i++) {
        const div = createDiv();
        const col = cols[i];
        col.appendChild(div);
        col.style.position = 'relative';
        addDragListener(div, (dx, dy) => {
            col.style.width = col.offsetWidth + dx + "px";
        })
    }

    const tableBody = table.querySelector('tbody');
    new ResizeObserver(() => {
        table.querySelectorAll('.columnDivider').forEach(div => {
            div.style.height = tableBody.offsetHeight + 'px';
        });
    }).observe(tableBody);

    function createDiv() {
        const div = document.createElement('div');
        div.classList.add('columnDivider');
        return div;
    }
}