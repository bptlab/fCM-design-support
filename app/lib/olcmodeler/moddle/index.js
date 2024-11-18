import {assign} from 'min-dash';

import OlcModdle from './OlcModdle';

import OlcDescriptors from './olc.json';

var packages = {
    olc: OlcDescriptors
};

export default function (additionalPackages, options) {
    var pks = assign({}, packages, additionalPackages);

    return new OlcModdle(pks, options);
}