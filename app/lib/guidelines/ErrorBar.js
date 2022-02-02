export default class ErrorBar {
    constructor(element) {
        this.element = element;
        this.table = element.getElementsByTagName('table')[0];
    }

    clear() {
        while (this.table.rows.length > 1) {
            this.table.deleteRow(1);
        }
    }

    displayRow({severity, element, artifact, message, link, quickFixes}) {
        const row = this.table.insertRow(-1);
        row.classList.add(severity.cssClass);
        row.classList.add('violationRow');
        const elementCell = row.insertCell(-1), artifactCell = row.insertCell(-1), messageCell = row.insertCell(-1), linkCell = row.insertCell(-1), quickFixesCell = row.insertCell(-1);
        elementCell.innerHTML = element.name;
        artifactCell.innerHTML = artifact;
        messageCell.innerHTML = message;
        const linkElement = document.createElement('a');
        linkElement.href = link;
        linkElement.target = '_blank';
        linkElement.innerHTML = '❓';
        linkCell.appendChild(linkElement);
        if (quickFixes && quickFixes.length > 0) {
            const quickFixesButton = document.createElement('button');
            quickFixesButton.innerHTML = '💡';
            quickFixesCell.appendChild(quickFixesButton);
            //TODO make functional
        }
    }
}