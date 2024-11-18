import AutoPlaceBehavior from './AutoPlaceBehavior';
import LayoutConnectionBehavior from '../../../../common/features/grid-snapping/LayoutConnectionBehavior';

export default {
    __init__: [
        'gridSnappingAutoPlaceBehavior',
        'gridSnappingLayoutConnectionBehavior',
    ],
    gridSnappingAutoPlaceBehavior: ['type', AutoPlaceBehavior],
    gridSnappingLayoutConnectionBehavior: ['type', LayoutConnectionBehavior]
};