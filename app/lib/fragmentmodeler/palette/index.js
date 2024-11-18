import FragmentPaletteProvider from './FragmentPaletteProvider';
import FragmentContextPadProvider from './FragmentContextPadProvider';
import FragmentReplaceMenuProvider from './FragmentReplaceMenuProvider';

export default {
    __init__: ['fragmentContextPadProvider', 'fragmentPaletteProvider', 'fragmentReplaceMenuProvider'],
    fragmentContextPadProvider: ['type', FragmentContextPadProvider],
    fragmentPaletteProvider: ['type', FragmentPaletteProvider],
    fragmentReplaceMenuProvider: ['type', FragmentReplaceMenuProvider]
};
