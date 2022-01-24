export default function getDropdown() {
    const dropdownMenu = document.createElement('div');
    dropdownMenu.classList.add('gs-dropdown-menu');
    dropdownMenu.style.display = 'block';
    dropdownMenu.style.position = 'relative';
    dropdownMenu.style.width = '50%';

    dropdownMenu.populate = function (options, onChange, element, labelFunc = x => x.name || x) {
        dropdownMenu.innerHTML = '';
        for (const option of options) {
            const entry = document.createElement('div');
            entry.option = option;
            entry.classList.add('gs-dropdown-entry');
            entry.innerHTML = labelFunc(option);
            entry.addEventListener('click', event => {
                onChange(option, element)
            });
            entry.setSelected = function(isSelected) {
                if (isSelected) {
                    this.classList.add('gs-dropdown-entry-selected');
                } else {
                    this.classList.remove('gs-dropdown-entry-selected');
                }
            }
            dropdownMenu.appendChild(entry);
        }
    } 

    dropdownMenu.getEntries = function() {
        return Array.from(this.children).filter(child => child.classList.contains('gs-dropdown-entry'));
    }

    dropdownMenu.getEntry = function(option) {
        return this.getEntries().filter(entry => entry.option === option)[0];
    }

    return dropdownMenu;
}
