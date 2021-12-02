import $ from 'jquery';

var dragTarget = undefined;

window.addEventListener('mousemove', function (e) { dragmove(e); });
window.addEventListener('touchmove', function (e) { dragmove(e); });
window.addEventListener('mouseup', dragend);
window.addEventListener('touchend', dragend);
$('.divider').each((index, divider) => {
    divider.style.backgroundColor = 'rgba(150,150,150,0.5)';
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
        if (dragTarget.classList.contains('vertical')) {
            var percentage = (e.pageX / window.innerWidth) * 100;
            if (percentage > 5 && percentage < 98) {
                var mainPercentage = 100 - percentage;
                prev.style.width = percentage + '%';
                next.style.width = mainPercentage + '%';
                dragTarget.style.left = 'calc('+percentage + '% - 10px)';
                next.style.left = percentage + '%';
            }
        } else {
            var percentage = (e.pageY / window.innerHeight) * 100;
            console.log(percentage);
            if (percentage > 5 && percentage < 98) {
                var mainPercentage = 100 - percentage;
                prev.style.height = percentage + '%';
                next.style.height = mainPercentage + '%';
                dragTarget.style.top = 'calc('+percentage + '% - 10px)';
                next.style.top = percentage + '%';
            }
        }
    }
}

function dragend() {
    $('.divider').each((index, divider) => {
        divider.style.backgroundColor = 'rgba(150,150,150,0.5)';
    });
    dragTarget = undefined;
}