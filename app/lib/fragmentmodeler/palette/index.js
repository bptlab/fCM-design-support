import FragmentPaletteProvider from './FragmentPaletteProvider';
import FragmentContextPadProvider from './FragmentContextPadProvider';

export default {
    __init__: [ 'fragmentContextPadProvider', 'fragmentPaletteProvider' ],
    fragmentContextPadProvider: [ 'type', FragmentContextPadProvider ],
    fragmentPaletteProvider: [ 'type', FragmentPaletteProvider ]
};
