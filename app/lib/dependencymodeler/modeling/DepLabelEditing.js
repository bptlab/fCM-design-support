export default function DepLabelEditing(eventBus, canvas, directEditing, commandStack) {
    directEditing.registerProvider(this);
    this._commandStack = commandStack;
    this._canvas = canvas;

    // complete on followup canvas operation
    eventBus.on([
        'autoPlace.start',
        'canvas.viewbox.changing',
        'drag.init',
        'element.mousedown',
        'popupMenu.open'
    ], function () {
        if (directEditing.isActive()) {
            directEditing.complete();
        }
    });

    // cancel on command stack changes (= when some other action is done)
    eventBus.on(['commandStack.changed'], function () {
        if (directEditing.isActive()) {
            directEditing.cancel();
        }
    });
}

DepLabelEditing.prototype.activate = function (element) {
    var text = element.businessObject.name || '';
    var options = {
        centerVertically: true,
        autoResize: true
    };

    var canvas = this._canvas;
    var zoom = canvas.zoom();
    var target = element;
    var bbox = canvas.getAbsoluteBBox(target);
    var mid = {
        x: bbox.x + bbox.width / 2,
        y: bbox.y + bbox.height / 2
    };

    var width = 90 * zoom,
        paddingTop = 7 * zoom,
        paddingBottom = 4 * zoom;
    var bounds = {
        width: width,
        height: bbox.height + paddingTop + paddingBottom,
        x: mid.x - width / 2,
        y: bbox.y - paddingTop
    };

    var style = {
        // TODO make look nice
    };
    var context = {
        text: text,
        options: options,
        bounds: bounds,
        style: style
    };

    return context;
}

DepLabelEditing.prototype.update = function (element, newLabel) {
    if (element.id !== 'start_state') {
        this._commandStack.execute('element.updateLabel', {
            element: element,
            newLabel: newLabel
        });
    }
}

DepLabelEditing.$inject = [
    'eventBus',
    'canvas',
    'directEditing',
    'commandStack'
];
