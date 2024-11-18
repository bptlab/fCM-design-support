import AutoPlaceModule from 'diagram-js/lib/features/auto-place';

import OlcAutoPlace from './OlcAutoPlace';

export default {
    __depends__: [AutoPlaceModule],
    __init__: ['olcAutoPlace'],
    olcAutoPlace: ['type', OlcAutoPlace]
};
