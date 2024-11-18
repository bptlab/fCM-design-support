import BaseRenderer from "diagram-js/lib/draw/BaseRenderer";
import { is } from "../../util/Util";
import { assign } from "min-dash";
import { getLabelColor, getSemantic } from "bpmn-js/lib/draw/BpmnRenderUtil";
import {
  append as svgAppend,
  classes as svgClasses,
  remove as svgRemove,
  select as svgSelect,
} from "tiny-svg";

const HIGH_PRIORITY = 1500;

export default class PoolRenderer extends BaseRenderer {
  constructor(eventBus, bpmnRenderer, textRenderer) {
    super(eventBus, HIGH_PRIORITY);

    this.bpmnRenderer = bpmnRenderer;
    this.textRenderer = textRenderer;
  }

  canRender(element) {
    return is(element, "bpmn:Participant");
  }

  drawShape(parentNode, element) {
    const shape = this.bpmnRenderer.drawShape(parentNode, element);
    svgRemove(svgSelect(parentNode, ".djs-label"));
    this.renderEmbeddedLabel(parentNode, element, "left-middle");
    return shape;
  }

  renderEmbeddedLabel(parentGfx, element, align) {
    let semantic = getSemantic(element);
    let displayedText = "";

    // Add position and unit information

    if (semantic.roles) {
      displayedText = semantic.roles.name;
    }
    if (semantic.units) {
      displayedText = semantic.units.name;
    }
    if (semantic.orgResources) {
      displayedText = semantic.orgResources.name;
    }

    return this.renderLabel(parentGfx, displayedText, {
      box: element,
      align: align,
      padding: 5,
      style: {
        fill: getLabelColor(element),
      },
    });
  }

  renderLabel(parentGfx, label, options) {
    options = assign(
      {
        size: {
          width: 100,
        },
      },
      options
    );

    var text = this.textRenderer.createText(label || "", options);

    svgClasses(text).add("djs-label");

    svgAppend(parentGfx, text);

    return text;
  }
}

PoolRenderer.$inject = ["eventBus", "bpmnRenderer", "textRenderer"];
