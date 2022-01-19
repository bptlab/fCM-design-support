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
            entry.classList.add('gs-dropdown-entry');
            entry.innerHTML = labelFunc(option);
            entry.addEventListener('click', event => {
                onChange(option, element)
            })
            dropdownMenu.appendChild(entry);
        }
    } 

    return dropdownMenu;
}
