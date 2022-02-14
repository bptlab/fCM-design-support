import { forEach } from 'min-dash';
import { is } from '../../util/Util';

const CLASS_MIN_DIMENSIONS = { width: 105, height: 73 };

export default function SpaceToolBehavior(eventBus) {
    eventBus.on('spaceTool.getMinDimensions', function(context) {
        const shapes = context.shapes;
        const minDimensions = {};

        forEach(shapes, function(shape) {
            if (is(shape, 'od:Class')) {
                minDimensions[shape.id] = CLASS_MIN_DIMENSIONS;
            }
        })

        return minDimensions;
    });
}

SpaceToolBehavior.$inject = [ 'eventBus' ];