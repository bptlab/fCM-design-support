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
            } else {
                //TODO: Handle bidirectional edges
                connection.waypoints = [center(connection.source), center(connection.target)];
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
    var centerP = center(element);
    var topRight = { x: x + width, y: y };
    var dx = width / 10, dy = height / 10;
    return [
        { x: centerP.x - dx, y: centerP.y - dy },
        { x: topRight.x - dx, y: topRight.y - dy },
        { x: topRight.x + dx, y: topRight.y + dy },
        { x: centerP.x + dx, y: centerP.y + dy }
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

//TODO move to common utils
function center(shape) {
    return {
      x: shape.x + shape.width / 2,
      y: shape.y + shape.height / 2
    };
  }
