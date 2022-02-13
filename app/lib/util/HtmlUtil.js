export function openAsOverlay(htmlElement, {x, y}) {
    htmlElement.close = () => {
        htmlElement.parentElement?.removeChild(htmlElement);
        document.removeEventListener('click', htmlElement.close, true);
    }
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

    document.addEventListener('click', htmlElement.close, true);
}