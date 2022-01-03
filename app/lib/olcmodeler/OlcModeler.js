import inherits from 'inherits';
import {groupBy} from 'min-dash'

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

import palette from './palette';
import draw from './draw';
import rules from './rules';
import modeling from './modeling';

import moddle from './moddle';

var emptyDiagram =
  `<?xml version="1.0" encoding="UTF-8"?>
  <olc:definitions xmlns:olc="http://bptlab/schema/olc" xmlns:olcDi="http://bptlab/schema/olcDi">
    <olc:olc id="MainOlc">
      <olc:state name="Foo" id="State_0" x="60" y="60" type="olc:State" />
      <olc:state name="Bar" id="State_1" x="160" y="60" type="olc:State" />
      <olc:transition id="Transition_3" sourceState="State_0" targetState="State_1" type="olc:Transition" />
      <olc:transition id="Transition_5" sourceState="State_1" targetState="State_0" type="olc:Transition" />
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
    additionalModules = []
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
    ZoomScrollModule
  ];

  // our own modules, contributing controls, customizations, and more
  const customModules = [
    palette,
    draw,
    rules,
    modeling,
    {
      moddle: ['value', new moddle({})]
    }
  ];

  Diagram.call(this, {
    canvas: {
      container
    },
    modules: [
      ...builtinModules,
      ...customModules,
      ...additionalModules
    ]
  });
}

inherits(OlcModeler, Diagram);

OlcModeler.prototype.createNew = function() {
  return this.importXML(emptyDiagram);
}

OlcModeler.prototype.importXML = function(xml, rootBoard) {

  var self = this;

  return new Promise(function(resolve, reject) {

    // hook in pre-parse listeners +
    // allow xml manipulation
    xml = self._emit('import.parse.start', { xml: xml }) || xml;

    self.get('moddle').fromXML(xml).then(function(result) {

      var definitions = result.rootElement;
      var references = result.references;
      var parseWarnings = result.warnings;
      var elementsById = result.elementsById;

      var context = {
        references: references,
        elementsById: elementsById,
        warnings: parseWarnings
      };

      // hook in post parse listeners +
      // allow definitions manipulation
      definitions = self._emit('import.parse.complete', {
        definitions: definitions,
        context: context
      }) || definitions;

      
      self.clear();

      self.importDefinitions(definitions, rootBoard);
      self._emit('import.done', { error: null, warnings: null });
      resolve();
    }).catch(function(err) {

      self._emit('import.parse.complete', {
        error: err
      });

      self._emit('import.done', { error: err, warnings: err.warnings });

      return reject(err);
    });

  });
};

OlcModeler.prototype.importDefinitions = function(definitions) {

  this._definitions = definitions;
  const elementFactory = this.get('elementFactory');
  var root = elementFactory.createRoot({type : 'olc:Olc', businessObject : definitions.olcs[0]});
  const canvas = this.get('canvas');
  canvas.setRootElement(root);

  var elements = groupBy(root.businessObject.get('Elements'), element => element.$type);
  var states = {};

  this._emit('import.render.start', { definitions: definitions });

  elements['olc:State'].forEach(state => {
    var stateVisual = elementFactory.createShape({
      type : 'olc:State', 
      businessObject : state, 
      x : parseInt(state.get('x')), 
      y : parseInt(state.get('y'))
    });
    states[state.get('id')] = stateVisual;
    canvas.addShape(stateVisual, root);
  });

  elements['olc:Transition'].forEach(transition => {
    var source = states[transition.get('sourceState').get('id')];
    var target = states[transition.get('targetState').get('id')];
    var transitionVisual = elementFactory.createConnection({
      type : 'olc:Transition', 
      businessObject : transition, 
      source : source, 
      target : target,
      waypoints : this.get('olcUpdater').connectionWaypoints(source, target)
    });
    canvas.addConnection(transitionVisual, root);
  });

  this._emit('import.render.complete', {});
}

OlcModeler.prototype.saveXML = function(options) {

  options = options || {};

  var self = this;

  var definitions = this._definitions;

  return new Promise(function(resolve, reject) {

    if (!definitions) {
      var err = new Error('no xml loaded');

      return reject(err);
    }

    // allow to fiddle around with definitions
    definitions = self._emit('saveXML.start', {
      definitions: definitions
    }) || definitions;

    self.get('moddle').toXML(definitions, options).then(function(result) {

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

      return resolve({ xml: xml });
    }).catch(function(err) {

      return reject(err);
    });
  });
};

OlcModeler.prototype._emit = function(type, event) {
  return this.get('eventBus').fire(type, event);
};