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

    document.addEventListener('click', htmlElement.close, true);
}