import DepLabelHandling from "./depLabelHandling";
import DepPaletteModule from './palette';
import DepDrawModule from './draw';
import DepRulesModule from './rules';
import DepModelingModule from './modeling';
import DepAutoPlaceModule from './auto-place';
import DepModdle from './moddle';
import {nextPosition, root} from '../util/Util';
import KeyboardModule from '../common/keyboard';
import EditorActionsModule from '../common/editor-actions';

import inherits from 'inherits';
import {groupBy} from 'min-dash';
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
import RulesModule from 'diagram-js/lib/features/rules';
import SelectionModule from 'diagram-js/lib/features/selection';
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll';
import CopyPasteModule from 'diagram-js/lib/features/copy-paste';

var emptyDiagram =
    `<?xml version="1.0" encoding="UTF-8"?>
<dep:definitions xmlns:olc="http://bptlab/schema/olc" xmlns:olcDi="http://bptlab/schema/olcDi">
  <dep:goal id="MainGoal">
    <dep:objective id="start_state" type="dep:Objective" name="Start State" x="465" y="293" />
  </dep:goal>
</dep:definitions>`;

/**
 * Our editor constructor
 *
 * @param { { container: Element, additionalModules?: Array<any> } } options
 *
 * @return {Diagram}
 */
export default function DependencyModeler(options) {
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
        DepPaletteModule,
        DepDrawModule,
        DepRulesModule,
        DepModelingModule,
        DepLabelHandling,
        DepAutoPlaceModule,
        {
            moddle: ['value', new DepModdle({})],
            dependencyModeler: ['value', this]
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
}

inherits(DependencyModeler, Diagram);

DependencyModeler.prototype.id = "DEP";
DependencyModeler.prototype.rank = 4;

DependencyModeler.prototype.name = function (constructionMode) {
    if (constructionMode) {
        return "Timeline";
    } else {
        return "Dependency Model";
    }
}

DependencyModeler.prototype.createNew = function () {
    return this.importXML(emptyDiagram);
}

DependencyModeler.prototype.show = function (goal) {
    this.clear();
    if (goal) {
        const elementFactory = this.get('elementFactory');
        var diagramRoot = elementFactory.createRoot({type: 'dep:Goal', businessObject: goal});
        const canvas = this.get('canvas');
        canvas.setRootElement(diagramRoot);

        var elements = groupBy(goal.get('Elements'), element => element.$type);
        var states = {};

        (elements['dep:Objective'] || []).forEach(state => {
            var stateVisual = elementFactory.createShape({
                type: 'dep:Objective',
                businessObject: state,
                x: parseInt(state.get('x')),
                y: parseInt(state.get('y'))
            });
            states[state.get('id')] = stateVisual;
            canvas.addShape(stateVisual, diagramRoot);
        });

        (elements['dep:Dependency'] || []).forEach(transition => {
            var source = states[transition.get('sourceObjective').get('id')];
            var target = states[transition.get('targetObjective').get('id')];
            var transitionVisual = elementFactory.createConnection({
                type: 'dep:Dependency',
                businessObject: transition,
                source: source,
                target: target,
                waypoints: this.get('depUpdater').connectionWaypoints(source, target)
            });
            canvas.addConnection(transitionVisual, diagramRoot);
        });
    }
}

DependencyModeler.prototype.createObjective = function (name) {
    const modeling = this.get('modeling');
    const canvas = this.get('canvas');
    const diagramRoot = canvas.getRootElement();

    const {x, y} = nextPosition(this, 'dep:Objective');
    const shape = modeling.createShape({
        type: 'dep:Objective',
        name: name,
        x: parseInt(x),
        y: parseInt(y)
    }, {x, y}, diagramRoot);
    return shape.businessObject;
}

DependencyModeler.prototype.deleteObjective = function (objective) {
    const modeling = this.get('modeling');
    const objectiveVisual = this.get('elementRegistry').get(objective.id);
    modeling.removeElements([objectiveVisual]);
}

DependencyModeler.prototype.renameObjective = function (objective, name) {
    const modeling = this.get('modeling');
    const objectiveVisual = this.get('elementRegistry').get(objective.id);
    modeling.updateLabel(objectiveVisual, name);
}

DependencyModeler.prototype.createDependency = function (sourceState, targetState) {
    const modeling = this.get('modeling');
    const sourceVisual = this.get('elementRegistry').get(sourceState.id);
    const targetVisual = this.get('elementRegistry').get(targetState.id);

    const transitionVisual = modeling.connect(sourceVisual, targetVisual, {
        type: 'dep:Dependency',
        source: sourceState,
        target: targetState,
        waypoints: this.get('depUpdater').connectionWaypoints(sourceState, targetState)
    });

    return transitionVisual.businessObject;
}

DependencyModeler.prototype.importXML = function (xml) {
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
}

//TODO handle errors during import
DependencyModeler.prototype.importDefinitions = function (definitions) {
    this.get('elementFactory')._ids.clear();
    this._definitions = definitions;
    this._emit('import.render.start', {definitions: definitions});
    this._goal = definitions.get('goals')[0];
    this.show(this._goal);
    this._emit('import.render.complete', {});
}

DependencyModeler.prototype.saveXML = function (options) {
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
}

DependencyModeler.prototype._emit = function (type, event) {
    return this.get('eventBus').fire(type, event);
}

DependencyModeler.prototype.ensureElementIsOnCanvas = function (element) {
    if (!this.get('elementRegistry').get(element.id)) {
        const rootElement = root(element);
        if (this._goal === rootElement) {
            this.show(rootElement);
        } else {
            throw 'Cannot display element. Is not part of a known goal.';
        }
    }
}