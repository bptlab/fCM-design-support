import inherits from 'inherits';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';


export default function OlcUpdater(eventBus, connectionDocking) {

    CommandInterceptor.call(this, eventBus);

    // connection cropping //////////////////////
    // crop connection ends during create/update
    function cropConnection(e) {

        var context = e.context,
            hints = context.hints || {},
            connection = context.connection;

        if (!context.cropped && hints.createElementsBehavior !== false) {
            if (connection.source === connection.target) {
                connection.waypoints = reflectiveEdge(connection.source);
            }
            connection.waypoints = connectionDocking.getCroppedWaypoints(connection);
            context.cropped = true;
        }
    }

    this.executed([
        'connection.layout',
        'connection.create'
    ], cropConnection);

    this.reverted(['connection.layout'], function (e) {
        delete e.context.cropped;
    });

    this.executed([
        'shape.create',
        'connection.create'
    ], (event) => {
        var context = event.context,
            element = context.shape || context.connection,
            oldParent = context.oldParent;

        linkToBusinessObjectParent(element)
    });

    this.executed([
        'connection.create'
    ], (event) => {
        var context = event.context,
            element = context.connection;            

        element.businessObject.sourceState = element.source.businessObject;
        element.businessObject.targetState = element.target.businessObject;
    });
}

function reflectiveEdge(element) {
    var { x, y, width, height } = element;
    var center = { x: x + width / 2, y: y + height / 2 };
    var topRight = { x: x + width, y: y };
    var dx = width / 10, dy = height / 10;
    return [
        { x: center.x - dx, y: center.y - dy },
        { x: topRight.x - dx, y: topRight.y - dy },
        { x: topRight.x + dx, y: topRight.y + dy },
        { x: center.x + dx, y: center.y + dy }
    ];
}

function linkToBusinessObjectParent(element) {
    var parentShape = element.parent;

    var businessObject = element.businessObject,
        parentBusinessObject = parentShape && parentShape.businessObject;

    parentBusinessObject.get('Elements').push(businessObject);
    businessObject.$parent = parentBusinessObject;
}

inherits(OlcUpdater, CommandInterceptor);

OlcUpdater.$inject = [
    'eventBus',
    'connectionDocking'
];
