import inherits from 'inherits';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';


export default function OlcUpdater(
    eventBus, connectionDocking,
    translate) {

    CommandInterceptor.call(this, eventBus);

    this._translate = translate;

    // connection cropping //////////////////////
    // crop connection ends during create/update
    function cropConnection(e) {

        var context = e.context,
            hints = context.hints || {},
            connection;

        if (!context.cropped && hints.createElementsBehavior !== false) {
            connection = context.connection;
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
}

inherits(OlcUpdater, CommandInterceptor);

OlcUpdater.$inject = [
    'eventBus',
    'connectionDocking',
    'translate'
];
