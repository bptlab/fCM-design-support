export function openAsOverlay(htmlElement, {x, y}) {
    document.body.appendChild(htmlElement);
    htmlElement.style.left = x + 'px';
    htmlElement.style.top = y + 'px';
    htmlElement.style.display = 'block';
    htmlElement.style.position = 'absolute';
    htmlElement.style.zIndex = 2000;
    htmlElement.style.height = 'fit-content';

    const width = htmlElement.offsetWidth;
    const height = htmlElement.offsetHeight;

    if (width + x > window.innerWidth) {
        x -= width;
        htmlElement.style.left = x + 'px';
    }

    if (height + y > window.innerHeight) {
        y -= height;
        htmlElement.style.top = y + 'px';
    }
    appendOverlayListeners(htmlElement);
}

export function appendOverlayListeners(htmlElement) {
    const documentListeners = [];

    function addDocumentListener(eventType, value) {
        document.addEventListener(eventType, value, true);
        documentListeners.push({eventType, value});
    }

    function removeDocumentListener({eventType, value}) {
        document.removeEventListener(eventType, value, true);
    }

    function removeAllDocumentListeners() {
        documentListeners.forEach(removeDocumentListener);
    }

    const handleEscapeKey = (event) => {
        if (event.key === 'Escape') {
            cancel(event);
        }
    }

    const handleClick = (event) => {
        if (!htmlElement.handleClick || !htmlElement.handleClick(event)) {
            if (event.button !== 2) { // Not right click
                confirm(event);
            } else {
                cancel(event);
            }
        }
    }

    const confirm = (event) => {
        htmlElement.confirm && htmlElement.confirm(event);
        close(event);
    }

    const cancel = (event) => {
        htmlElement.cancel && htmlElement.cancel(event);
        close(event);
    }

    const close = (event) => {
        htmlElement.close && htmlElement.close(event);
        htmlElement.parentElement?.removeChild(htmlElement);
        removeAllDocumentListeners();
    }
    addDocumentListener('click', handleClick);
    addDocumentListener('keydown', handleEscapeKey, true);

    return close;
}