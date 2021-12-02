import $ from 'jquery';

var dragTarget = undefined;

window.addEventListener('mousemove', function (e) { dragmove(e); });
window.addEventListener('touchmove', function (e) { dragmove(e); });
window.addEventListener('mouseup', dragend);
window.addEventListener('touchend', dragend);
$('.divider').each((index, divider) => {
    divider.style.backgroundColor = 'transparent';
    divider.addEventListener('mousedown', function (e) { dragstart(e); });
    divider.addEventListener('touchstart', function (e) { dragstart(e); });
});

function dragstart(e) {
    console.log(e);
    e.preventDefault();
    dragTarget = e.target;
}

function dragmove(e) {
    if (dragTarget) {
        dragTarget.style.backgroundColor = 'blue';
        var prev = $(dragTarget).prev('div')[0];
        var next = $(dragTarget).next('div')[0];
        if (true) {
            var percentage = (e.pageX / window.innerWidth) * 100;
            if (percentage > 5 && percentage < 98) {
                var mainPercentage = 100 - percentage;
                prev.style.width = percentage + '%';
                next.style.width = mainPercentage + '%';
                dragTarget.style.left = 'calc('+percentage + '% - 10px)';
                next.style.left = percentage + '%';
            }
        } else {
            var containertop = Number(w3_getStyleValue(document.getElementById('container'), 'top').replace('px', ''));
            var percentage = ((e.pageY - containertop + 20) / (window.innerHeight - containertop + 20)) * 100;
            if (percentage > 5 && percentage < 98) {
                var mainPercentage = 100 - percentage;
                document.getElementById('textareacontainer').style.height = percentage + '%';
                document.getElementById('iframecontainer').style.height = mainPercentage + '%';
                fixDragBtn();
            }
        }
    }
}

function dragend() {
    $('.divider').each((index, divider) => {
        divider.style.backgroundColor = 'transparent';
    });
    dragTarget = undefined;
}