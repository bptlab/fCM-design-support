export default function getDropdown() {
    const dropdownMenu = document.createElement('div');
    dropdownMenu.classList.add('dd-dropdown-menu');

    dropdownMenu.populate = function (options, onChange, element, labelFunc = x => x.name || x) {
        this.innerHTML = '';
        for (const option of options) {
            const entry = document.createElement('div');
            entry.option = option;
            entry.classList.add('dd-dropdown-entry');
            entry.innerHTML = labelFunc(option);
            entry.addEventListener('click', event => {
                onChange(option, element)
            });
            entry.setSelected = function(isSelected) {
                if (isSelected) {
                    this.classList.add('dd-dropdown-entry-selected');
                } else {
                    this.classList.remove('dd-dropdown-entry-selected');
                }
            }
            this.appendChild(entry);
        }
    } 

    dropdownMenu.getEntries = function() {
        return Array.from(this.children).filter(child => child.classList.contains('dd-dropdown-entry'));
    }

    dropdownMenu.getEntry = function(option) {
        return this.getEntries().filter(entry => entry.option === option)[0];
    }

    dropdownMenu.addCreateElementInput = function (onConfirm) {
        const createNewStateEditorContainer = document.createElement('div');
        createNewStateEditorContainer.classList.add('dd-dropdown-create-input');
        const createNewStateEditor = document.createElement('input');
        createNewStateEditor.type = 'text';
        createNewStateEditor.addEventListener('keypress', event => {
            if (event.key === 'Enter') {
                onConfirm(event);
            }
        });
        createNewStateEditorContainer.appendChild(createNewStateEditor);
        this.appendChild(createNewStateEditorContainer);
    }

    return dropdownMenu;
}
