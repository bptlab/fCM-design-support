import inherits from 'inherits';
import {findIndex, groupBy, without} from 'min-dash'

import Diagram from 'diagram-js';

import ConnectModule from 'diagram-js/lib/features/connect';
import ConnectionPreviewModule from 'diagram-js/lib/features/connection-preview';
import ContextPadModule from 'diagram-js/lib/features/context-pad';
import CreateModule from 'diagram-js/lib/features/create';
import LassoToolModule from 'diagram-js/lib/features/lasso-tool';
import ModelingModule from 'diagram-js/lib/features/modeling';
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas';
import MoveModule from 'diagram-js/lib/features/move';
import OutlineModule from 'diagram-js/lib/features/outline';
import PaletteModule from 'diagram-js/lib/features/palette';
// import ResizeModule from 'diagram-js/lib/features/resize';
import RulesModule from 'diagram-js/lib/features/rules';
import SelectionModule from 'diagram-js/lib/features/selection';
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll';
import EditorActionsModule from '../common/editor-actions';
import CopyPasteModule from 'diagram-js/lib/features/copy-paste';
import KeyboardModule from '../common/keyboard';

import OlcPaletteModule from './palette';
import OlcDrawModule from './draw';
import OlcRulesModule from './rules';
import OlcModelingModule from './modeling';
import OlcButtonBarModule from './buttonbar';
import OlcAutoPlaceModule from './auto-place';

import OlcModdle from './moddle';
import OlcEvents from './OlcEvents';
import {is, nextPosition, root} from '../util/Util';

var emptyDiagram =
    `<?xml version="1.0" encoding="UTF-8"?>
<olc:definitions xmlns:olc="http://bptlab/schema/olc" xmlns:olcDi="http://bptlab/schema/olcDi">
</olc:definitions>`;

var exampleDiagram =
    `<?xml version="1.0" encoding="UTF-8"?>
<olc:definitions xmlns:olc="http://bptlab/schema/olc" xmlns:olcDi="http://bptlab/schema/olcDi">
  <olc:olc id="MainOlc" name="Olc Uno">
    <olc:state name="Foo" id="State_0" type="olc:State" x="119" y="177" />
    <olc:state name="Bar" id="State_1" type="olc:State" x="289" y="176" />
    <olc:transition id="Transition_1" sourceState="State_0" targetState="State_1" type="olc:Transition" />
  </olc:olc>
  <olc:olc id="SecondOlc" name="Olc Dos">
    <olc:state name="Boo" id="State_3" type="olc:State" x="119" y="177" />
    <olc:state name="Klar" id="State_4" type="olc:State" x="289" y="176" />
    <olc:transition id="Transition_2" sourceState="State_3" targetState="State_4" type="olc:Transition" />
  </olc:olc>
</olc:definitions>`;

/**
 * Our editor constructor
 *
 * @param { { container: Element, additionalModules?: Array<any> } } options
 *
 * @return {Diagram}
 */
export default function OlcModeler(options) {

    const {
        container,
        additionalModules = [],
        keyboard
    } = options;

    // default modules provided by the toolbox
    const builtinModules = [
        ConnectModule,
        ConnectionPreviewModule,
        ContextPadModule,
        CreateModule,
        LassoToolModule,
        ModelingModule,
        MoveCanvasModule,
        MoveModule,
        OutlineModule,
        PaletteModule,
        RulesModule,
        SelectionModule,
        ZoomScrollModule,
        EditorActionsModule,
        KeyboardModule,
        CopyPasteModule
    ];

    // our own modules, contributing controls, customizations, and more
    const customModules = [
        OlcPaletteModule,
        OlcDrawModule,
        OlcRulesModule,
        OlcModelingModule,
        OlcButtonBarModule,
        OlcAutoPlaceModule,
        {
            moddle: ['value', new OlcModdle({})],
            olcModeler: ['value', this]
        }
    ];

    const diagramOptions = {
        canvas: {
            container
        },
        keyboard,
        modules: [
            ...builtinModules,
            ...customModules,
            ...additionalModules
        ]
    };

    Diagram.call(this, diagramOptions);

    this.get('eventBus').fire('attach'); // Needed for key listeners to work

    // Hide canvas when no olc is available
    this.get('eventBus').on(OlcEvents.DEFINITIONS_CHANGED, event => {
        const container = this.get('canvas').getContainer();
        const shouldBeVisible = event.definitions.get('olcs').length !== 0;
        const currentVisibility = container.style.visibility;
        if (!currentVisibility || (shouldBeVisible !== (currentVisibility !== 'hidden'))) {
            if (shouldBeVisible) {
                container.style.visibility = '';
            } else {
                container.style.visibility = 'hidden';
            }
        }
    });
}

inherits(OlcModeler, Diagram);

OlcModeler.prototype.id = "OLC";
OlcModeler.prototype.rank = 7;

OlcModeler.prototype.name = function (constructionMode) {
    if (constructionMode) {
        return "OLCs";
    } else {
        return "OLCs";
    }
};

OlcModeler.prototype.createNew = function () {
    return this.importXML(emptyDiagram);
}

OlcModeler.prototype.importXML = function (xml) {

    var self = this;

    return new Promise(function (resolve, reject) {

        // hook in pre-parse listeners +
        // allow xml manipulation
        xml = self._emit('import.parse.start', {xml: xml}) || xml;

        self.get('moddle').fromXML(xml).then(function (result) {

            var definitions = result.rootElement;
            var references = result.references;
            var parseWarnings = result.warnings;
            var elementsById = result.elementsById;

            var context = {
                references: references,
                elementsById: elementsById,
                warnings: parseWarnings
            };

            for (let id in elementsById) {
                self.get('elementFactory')._ids.claim(id, elementsById[id]);
            }

            // hook in post parse listeners +
            // allow definitions manipulation
            definitions = self._emit('import.parse.complete', {
                definitions: definitions,
                context: context
            }) || definitions;
            self.importDefinitions(definitions);
            self._emit('import.done', {error: null, warnings: null});
            resolve();
        }).catch(function (err) {

            self._emit('import.parse.failed', {
                error: err
            });

            self._emit('import.done', {error: err, warnings: err.warnings});

            return reject(err);
        });

    });
};

//TODO handle errors during import
OlcModeler.prototype.importDefinitions = function (definitions) {
    this.get('elementFactory')._ids.clear();
    this._definitions = definitions;
    this._emit(OlcEvents.DEFINITIONS_CHANGED, {definitions: definitions});
    this._emit('import.render.start', {definitions: definitions});
    this.showOlc(definitions.olcs[0]);
    this._emit('import.render.complete', {});
}

OlcModeler.prototype.showOlc = function (olc) {
    this.clear();
    this._olc = olc;
    if (olc) {
        const elementFactory = this.get('elementFactory');
        var diagramRoot = elementFactory.createRoot({type: 'olc:Olc', businessObject: olc});
        const canvas = this.get('canvas');
        canvas.setRootElement(diagramRoot);

        var elements = groupBy(olc.get('Elements'), element => element.$type);
        var states = {};

        (elements['olc:State'] || []).forEach(state => {
            var stateVisual = elementFactory.createShape({
                type: 'olc:State',
                businessObject: state,
                x: parseInt(state.get('x')),
                y: parseInt(state.get('y'))
            });
            states[state.get('id')] = stateVisual;
            canvas.addShape(stateVisual, diagramRoot);
        });

        (elements['olc:Transition'] || []).forEach(transition => {
            var source = states[transition.get('sourceState').get('id')];
            var target = states[transition.get('targetState').get('id')];
            var transitionVisual = elementFactory.createConnection({
                type: 'olc:Transition',
                businessObject: transition,
                source: source,
                target: target,
                waypoints: this.get('olcUpdater').connectionWaypoints(source, target)
            });
            canvas.addConnection(transitionVisual, diagramRoot);
        });
    }

    this._emit(OlcEvents.SELECTED_OLC_CHANGED, {olc: olc});
}

OlcModeler.prototype.showOlcById = function (id) {
    if (id && this._definitions && id !== (this._olc && this._olc.get('id'))) {
        var olc = this._definitions.get('olcs').filter(olc => olc.get('id') === id)[0];
        if (olc) {
            this.showOlc(olc);
        } else {
            throw 'Unknown olc with class id \"' + id + '\"';
        }
    }
}

OlcModeler.prototype.addOlc = function (clazz) {
    var olc = this.get('elementFactory').createBusinessObject('olc:Olc', {
        name: clazz.name || '<TBD>',
        classRef: clazz
    });
    this._definitions.get('olcs').push(olc);
    this._emit(OlcEvents.DEFINITIONS_CHANGED, {definitions: this._definitions});
    this.showOlc(olc);
}

OlcModeler.prototype.getCurrentOlc = function () {
    return this._olc;
}

OlcModeler.prototype.deleteCurrentOlc = function () {
    this.deleteOlc(this._olc.classRef);
}

OlcModeler.prototype.deleteOlc = function (clazz) {
    var olc = this.getOlcByClass(clazz);
    var currentIndex = findIndex(this._definitions.olcs, olc);
    var indexAfterRemoval = Math.min(currentIndex, this._definitions.olcs.length - 2);

    this._definitions.olcs = without(this._definitions.olcs, olc);
    this._emit(OlcEvents.DEFINITIONS_CHANGED, {definitions: this._definitions});

    if (olc === this._olc) {
        this.showOlc(this._definitions.olcs[indexAfterRemoval]);
    }
}

OlcModeler.prototype.renameOlc = function (name, clazz) {
    const olc = this.getOlcByClass(clazz);
    olc.name = name;
    this._emit(OlcEvents.DEFINITIONS_CHANGED, {definitions: this._definitions});
}

OlcModeler.prototype.getOlcById = function (id) {
    return this.getOlcs().filter(olc => olc.id === id)[0];
}

OlcModeler.prototype.getOlcByClass = function (clazz) {
    const olc = this.getOlcs().filter(olc => olc.classRef === clazz)[0];
    if (!olc) {
        throw 'Unknown olc of class \"' + clazz.name + '\"';
    } else {
        return olc;
    }
}

OlcModeler.prototype.getStateById = function (id) {
    return this.getOlcs().flatMap(olc => olc.get('Elements')).filter(element => is(element, 'olc:State')).filter(state => state.id === id)[0];
}

OlcModeler.prototype.getOlcs = function () {
    return this._definitions.get('olcs');
}

OlcModeler.prototype.createState = function (name, olc) {
    this.showOlcById(olc.id);

    const modeling = this.get('modeling');
    const canvas = this.get('canvas');
    const diagramRoot = canvas.getRootElement();

    const {x, y} = nextPosition(this, 'olc:State');
    const shape = modeling.createShape({
        type: 'olc:State',
        name: name,
        x: parseInt(x),
        y: parseInt(y)
    }, {x, y}, diagramRoot);
    return shape.businessObject;
}

OlcModeler.prototype.createTransition = function (sourceState, targetState) {
    this.showOlcById(root(sourceState).id);
    const modeling = this.get('modeling');
    const sourceVisual = this.get('elementRegistry').get(sourceState.id);
    const targetVisual = this.get('elementRegistry').get(targetState.id);

    const transitionVisual = modeling.connect(sourceVisual, targetVisual, {
        type: 'olc:Transition',
        source: sourceState,
        target: targetState,
        waypoints: this.get('olcUpdater').connectionWaypoints(sourceState, targetState)
    });

    return transitionVisual.businessObject;
}

OlcModeler.prototype.saveXML = function (options) {

    options = options || {};

    var self = this;

    var definitions = this._definitions;

    return new Promise(function (resolve, reject) {

        if (!definitions) {
            var err = new Error('no xml loaded');

            return reject(err);
        }

        // allow to fiddle around with definitions
        definitions = self._emit('saveXML.start', {
            definitions: definitions
        }) || definitions;

        self.get('moddle').toXML(definitions, options).then(function (result) {

            var xml = result.xml;

            try {
                xml = self._emit('saveXML.serialized', {
                    error: null,
                    xml: xml
                }) || xml;

                self._emit('saveXML.done', {
                    error: null,
                    xml: xml
                });
            } catch (e) {
                console.error('error in saveXML life-cycle listener', e);
            }

            return resolve({xml: xml});
        }).catch(function (err) {

            return reject(err);
        });
    });
};

OlcModeler.prototype._emit = function (type, event) {
    return this.get('eventBus').fire(type, event);
};

OlcModeler.prototype.ensureElementIsOnCanvas = function (element) {
    if (!this.get('elementRegistry').get(element.id)) {
        const rootElement = root(element);
        if (this.getOlcs().includes(rootElement)) {
            this.showOlc(rootElement);
        } else {
            throw 'Cannot display element. Is not part of a known olc';
        }
    }
}