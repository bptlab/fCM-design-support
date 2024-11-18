import PaletteProvider from './PaletteProvider';
import DepContextPadProvider from './DepContextPadProvider';

import PaletteModule from 'diagram-js/lib/features/palette';
import ContextPadModule from 'diagram-js/lib/features/context-pad';
import CreateModule from 'diagram-js/lib/features/create';
import SpaceToolModule from 'diagram-js/lib/features/space-tool';
import LassoToolModule from 'diagram-js/lib/features/lasso-tool';
import HandToolModule from 'diagram-js/lib/features/hand-tool';
import translate from 'diagram-js/lib/i18n/translate';
import GlobalConnectModule from 'diagram-js/lib/features/global-connect';

export default {
    __depends__: [
        PaletteModule,
        ContextPadModule,
        CreateModule,
        SpaceToolModule,
        LassoToolModule,
        HandToolModule,
        GlobalConnectModule,
        translate
    ],
    __init__: [
        'depContextPadProvider',
        'paletteProvider'
    ],
    paletteProvider: ['type', PaletteProvider],
    depContextPadProvider: ['type', DepContextPadProvider]
};