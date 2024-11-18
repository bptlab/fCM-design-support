import DepModdle from './DepModdle';
import DepDescriptors from './dep.json';

import {assign} from 'min-dash';

var packages = {
    dep: DepDescriptors
};

export default function (additionalPackages, options) {
    var pks = assign({}, packages, additionalPackages);

    return new DepModdle(pks, options);
}