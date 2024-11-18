import DepAutoPlace from './DepAutoPlace';

import AutoPlaceModule from 'diagram-js/lib/features/auto-place';

export default {
    __depends__: [AutoPlaceModule],
    __init__: ['depAutoPlace'],
    depAutoPlace: ['type', DepAutoPlace]
};
