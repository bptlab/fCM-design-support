import {assign, map, pick,} from 'min-dash';

import {isAny} from '../../../common/features/modeling/ModelingUtil';

import {is} from '../../../common/util/ModelUtil';


export default function ODFactory(moddle) {
    this._model = moddle;
}

ODFactory.$inject = ['moddle'];


ODFactory.prototype._needsId = function (element) {
    return isAny(element, [
        'od:BoardElement'
    ]);
};

ODFactory.prototype._ensureId = function (element) {

    // generate semantic ids for elements
    // od:Class -> Object_ID
    var prefix;

    if (is(element, 'od:Class')) {
        prefix = 'Object'; //TODO this should not be Object. Maybe the special case can be scrapped completely
    } else {
        prefix = (element.$type || '').replace(/^[^:]*:/g, '');
    }

    prefix += '_';

    if (!element.id && this._needsId(element)) {
        element.id = this._model.ids.nextPrefixed(prefix, element);
    }
};


ODFactory.prototype.create = function (type, attrs) {
    if (type === 'od:Association') {
        attrs = assign({sourceCardinality: '0..*', targetCardinality: '0..*', inheritance: false}, attrs);
    }
    var element = this._model.create(type, attrs || {});
    if (type === 'od:Class') {
        element.attributeValues = '';
    }

    this._ensureId(element);

    return element;
};


ODFactory.prototype.createDiLabel = function (shape) {
    const labelElementClassMap = {
        sourceCardinality: 'odDi:OdSourceLabel',
        targetCardinality: 'odDi:OdTargetLabel'
    }
    var labelElementClass = shape.labelAttribute && labelElementClassMap[shape.labelAttribute] || 'odDi:OdLabel';
    return this.create(labelElementClass, {
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
    return this.create('odDi:Association', assign({
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