import { getNewShapePosition } from './OlcAutoPlaceUtil';

export default function AutoPlace(eventBus) {
    eventBus.on('autoPlace', function(context) {
        const shape = context.shape,
            source = context.source;

        return getNewShapePosition(source, shape);
    });
}

AutoPlace.$inject = [
    'eventBus'
];
