import $ from 'jquery';

var dragTarget = undefined;

window.addEventListener('mousemove', function (e) {
    dragmove(e);
});
window.addEventListener('touchmove', function (e) {
    dragmove(e);
});
window.addEventListener('mouseup', dragend);
window.addEventListener('touchend', dragend);
$('.divider').each((index, divider) => {
    divider.addEventListener('mousedown', function (e) {
        dragstart(e);
    });
    divider.addEventListener('touchstart', function (e) {
        dragstart(e);
    });
});

function dragstart(e) {
    e.preventDefault();
    dragTarget = e.target;
}

function dragmove(e) {
    if (dragTarget) {
        dragTarget.classList.add('dragged')
        var parent = $(dragTarget).parent()[0];
        var parentStyle = window.getComputedStyle(parent);
        var prev = $(dragTarget).prev('div')[0];
        var next = $(dragTarget).next('div')[0];
        if (dragTarget.classList.contains('vertical')) {
            var parentInnerWidth = parseInt(parentStyle.width, 10) - parseInt(parentStyle.paddingLeft, 10) - parseInt(parentStyle.paddingRight, 10);
            var percentage = ((e.pageX - (parent.getBoundingClientRect().left + parseInt(parentStyle.paddingLeft, 10))) / parentInnerWidth) * 100;
            if (percentage > 5 && percentage < 95) {
                var mainPercentage = 100 - percentage;
                prev.style.width = percentage + '%';
                next.style.width = mainPercentage + '%';
                dragTarget.style.left = 'calc(' + percentage * (parentInnerWidth / parseInt(parentStyle.width, 10)) + '% - 10px - ' + parentStyle.paddingLeft + ')';
                next.style.left = 0 + '%';
            }
        } else {
            var parentInnerHeight = parseInt(parentStyle.height, 10) - parseInt(parentStyle.paddingTop, 10) - parseInt(parentStyle.paddingBottom, 10);
            var percentage = ((e.pageY - (parent.getBoundingClientRect().top + parseInt(parentStyle.paddingTop, 10))) / parentInnerHeight) * 100;
            if (percentage > 5 && percentage < 95) {
                var mainPercentage = 100 - percentage;
                prev.style.height = percentage + '%';
                next.style.height = mainPercentage + '%';
                dragTarget.style.top = 'calc(' + percentage * (parentInnerHeight / parseInt(parentStyle.height, 10)) + '% - 10px + ' + parentStyle.paddingTop + ')';
                next.style.top = 0 + '%';
            }
        }
    }
}

function dragend() {
    $('.divider').each((index, divider) => {
        divider.classList.remove('dragged')
    });
    dragTarget = undefined;
}