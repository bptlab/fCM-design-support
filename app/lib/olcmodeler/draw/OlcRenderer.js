import inherits from 'inherits';

import {assign, isObject} from 'min-dash';

import {query as domQuery} from 'min-dom';

import {append as svgAppend, attr as svgAttr, classes as svgClasses, create as svgCreate} from 'tiny-svg';

import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import TextUtil from 'diagram-js/lib/util/Text';

import Ids from 'ids';

import {is} from '../../util/Util';
import {componentsToPath} from 'diagram-js/lib/util/RenderUtil';

var RENDERER_IDS = new Ids();

var DEFAULT_FILL_OPACITY = .95;
var DEFAULT_TEXT_SIZE = 16;
var LINE_HEIGHT_RATIO = 1.2;

export default function OlcRenderer(eventBus, styles,
                                    canvas, priority) {

    BaseRenderer.call(this, eventBus, priority);
    var markers = {};
    var rendererId = RENDERER_IDS.next();


    var computeStyle = styles.computeStyle;

    var defaultTextStyle = {
        fontFamily: 'IBM Plex, sans-serif',
        fontSize: DEFAULT_TEXT_SIZE,
        fontWeight: 'normal',
        lineHeight: LINE_HEIGHT_RATIO
    };
    var textUtil = new TextUtil({
        style: defaultTextStyle
    });

    function drawCircle(parentGfx, width, height, offset, attrs) {

        if (isObject(offset)) {
            attrs = offset;
            offset = 0;
        }

        offset = offset || 0;

        attrs = computeStyle(attrs, {
            stroke: 'black',
            strokeWidth: 2,
            fill: 'white'
        });

        if (attrs.fill === 'none') {
            delete attrs.fillOpacity;
        }

        var cx = width / 2,
            cy = height / 2;

        var circle = svgCreate('circle');
        svgAttr(circle, {
            cx: cx,
            cy: cy,
            r: Math.round((width + height) / 4 - offset)
        });
        svgAttr(circle, attrs);

        svgAppend(parentGfx, circle);

        return circle;
    }

    function drawPath(parentGfx, d, attrs) {

        attrs = computeStyle(attrs, ['no-fill'], {
            strokeWidth: 2,
            stroke: 'black'
        });

        var path = svgCreate('path');
        svgAttr(path, {d: d});
        svgAttr(path, attrs);

        svgAppend(parentGfx, path);

        return path;
    }


    function renderLabel(parentGfx, label, options) {

        options = assign({
            size: {
                width: 100
            }
        }, options);

        var text = textUtil.createText(label || '', options);

        svgClasses(text).add('djs-label');

        svgAppend(parentGfx, text);

        return text;
    }

    function createPathFromConnection(connection) {
        var waypoints = connection.waypoints;

        var pathData = 'm  ' + waypoints[0].x + ',' + waypoints[0].y;
        for (var i = 1; i < waypoints.length; i++) {
            pathData += 'L' + waypoints[i].x + ',' + waypoints[i].y + ' ';
        }
        return pathData;
    }

    function marker(fill, stroke) {
        var id = '-' + colorEscape(fill) + '-' + colorEscape(stroke) + '-' + rendererId;

        if (!markers[id]) {
            createMarker(id, fill, stroke);
        }

        return 'url(#' + id + ')';
    }

    function colorEscape(str) {

        // only allow characters and numbers
        return str.replace(/[^0-9a-zA-z]+/g, '_');
    }

    function createMarker(id, type, fill, stroke) {
        var linkEnd = svgCreate('path');
        svgAttr(linkEnd, {d: 'M 1 5 L 11 10 L 1 15 Z'});

        addMarker(id, {
            element: linkEnd,
            ref: {x: 11, y: 10},
            scale: 0.5,
            attrs: {
                fill: fill,
                stroke: stroke
            }
        });
    }

    function addMarker(id, options) {
        var attrs = assign({
            fill: 'black',
            strokeWidth: 1,
            strokeLinecap: 'round',
            strokeDasharray: 'none'
        }, options.attrs);

        var ref = options.ref || {x: 0, y: 0};

        var scale = options.scale || 1;

        // fix for safari / chrome / firefox bug not correctly
        // resetting stroke dash array
        if (attrs.strokeDasharray === 'none') {
            attrs.strokeDasharray = [10000, 1];
        }

        var marker = svgCreate('marker');

        svgAttr(options.element, attrs);

        svgAppend(marker, options.element);

        svgAttr(marker, {
            id: id,
            viewBox: '0 0 20 20',
            refX: ref.x,
            refY: ref.y,
            markerWidth: 20 * scale,
            markerHeight: 20 * scale,
            orient: 'auto'
        });

        var defs = domQuery('defs', canvas._svg);

        if (!defs) {
            defs = svgCreate('defs');

            svgAppend(canvas._svg, defs);
        }

        svgAppend(defs, marker);

        markers[id] = marker;
    }

    this.handlers = {
        'olc:State': function (parentGfx, element) {

            var attrs = {
                fill: 'white',
                stroke: 'black',
                fillOpacity: DEFAULT_FILL_OPACITY
            };

            var circle = drawCircle(parentGfx, element.width, element.height, attrs);

            var semantic = element.businessObject || {name: '< unknown >'};
            renderLabel(parentGfx, semantic.name, {
                box: element,
                align: 'center-middle',
                padding: 5,
                style: {
                    fill: 'black',
                    fontSize: DEFAULT_TEXT_SIZE
                },
            });

            return circle;
        },
        'olc:Transition': function (parentGfx, element) {

            var pathData = createPathFromConnection(element);

            var color = "black";

            var attrs = {
                strokeLinejoin: 'round',
                markerEnd: marker(color, color),
                stroke: color
            };
            return drawPath(parentGfx, pathData, attrs);
        },
    };

}


inherits(OlcRenderer, BaseRenderer);

OlcRenderer.$inject = [
    'eventBus',
    'styles',
    'canvas'
];


OlcRenderer.prototype.canRender = function (element) {
    return is(element, 'olc:State') || is(element, 'olc:Transition');
};

OlcRenderer.prototype.drawShape = function (parentGfx, element) {
    var type = element.type;
    var handler = this.handlers[type];
    return handler(parentGfx, element);
};

OlcRenderer.prototype.drawConnection = OlcRenderer.prototype.drawShape;

OlcRenderer.prototype.getShapePath = function (element) {
    return getCirclePath(element);
};

// Utility
function getCirclePath(shape) {

    var cx = shape.x + shape.width / 2,
        cy = shape.y + shape.height / 2,
        radius = shape.width / 2;

    var circlePath = [
        ['M', cx, cy],
        ['m', 0, -radius],
        ['a', radius, radius, 0, 1, 1, 0, 2 * radius],
        ['a', radius, radius, 0, 1, 1, 0, -2 * radius],
        ['z']
    ];

    return componentsToPath(circlePath);
}