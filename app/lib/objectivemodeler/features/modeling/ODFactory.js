import {assign, map, pick,} from 'min-dash';

import {isAny} from '../../../common/features/modeling/ModelingUtil';

import {is} from '../../../common/util/ModelUtil';


export default function ODFactory(moddle) {
    this._model = moddle;
}

ODFactory.$inject = ['moddle'];


ODFactory.prototype._needsId = function (element) {
    return isAny(element, [
        'om:BoardElement', 'odDi:OdRootBoard', 'odDi:OdPlane'
    ]);
};

ODFactory.prototype._ensureId = function (element) {

    // generate semantic ids for elements
    // om:Object -> Object_ID
    var prefix;

    if (is(element, 'om:Object')) {
        prefix = 'Object';
    } else {
        prefix = (element.$type || '').replace(/^[^:]*:/g, '');
    }

    prefix += '_';

    if (!element.id && this._needsId(element)) {
        element.id = this._model.ids.nextPrefixed(prefix, element);
    }
};


ODFactory.prototype.create = function (type, attrs) {
    var element = this._model.create(type, attrs || {});
    if (type === 'om:Object') {
        element.state = null;
    }

    this._ensureId(element);

    return element;
};


ODFactory.prototype.createDiLabel = function () {
    return this.create('odDi:OdLabel', {
        bounds: this.createDiBounds()
    });
};


ODFactory.prototype.createDiShape = function (semantic, bounds, attrs) {

    return this.create('odDi:OdShape', assign({
        boardElement: semantic,
        bounds: this.createDiBounds(bounds)
    }, attrs));
};


ODFactory.prototype.createDiBounds = function (bounds) {
    return this.create('dc:Bounds', bounds);
};

ODFactory.prototype.createDiEdge = function (semantic, waypoints, attrs) {
    return this.create('odDi:Link', assign({
        boardElement: semantic
    }, attrs));
};


ODFactory.prototype.createDiPlane = function (semantic) {
    return this.create('odDi:OdPlane', {
        boardElement: semantic
    });
};

ODFactory.prototype.createDiWaypoints = function (waypoints) {
    var self = this;

    return map(waypoints, function (pos) {
        return self.createDiWaypoint(pos);
    });
};

ODFactory.prototype.createDiWaypoint = function (point) {
    return this.create('dc:Point', pick(point, ['x', 'y']));
};