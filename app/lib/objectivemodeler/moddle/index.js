import {assign} from 'min-dash';

import Moddle from './Moddle';

import ODDescriptors from './resources/om.json';
import DiDescriptors from '../../common/moddle/odDi.json';
import DcDescriptors from '../../common/moddle/dc.json';

var packages = {
    om: ODDescriptors,
    odDi: DiDescriptors,
    dc: DcDescriptors,
};

export default function (additionalPackages, options) {
    var pks = assign({}, packages, additionalPackages);

    return new Moddle(pks, options);
}
