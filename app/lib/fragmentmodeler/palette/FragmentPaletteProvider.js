export default class FragmentPaletteProvider {
    constructor(palette) {
        palette.registerProvider(this);
    }

    getPaletteEntries(element) {
        return function(entries) {
            delete entries['create.subprocess-expanded'];
            delete entries['create.data-store'];
            delete entries['create.group'];
            delete entries['create.participant-expanded'];
            delete entries['create.end-event'];

            return entries;
        }
    }
}

FragmentPaletteProvider.$inject = [
    'palette'
];