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

export default class TaskRenderer extends BaseRenderer {
  constructor(eventBus, bpmnRenderer, textRenderer) {
    super(eventBus, HIGH_PRIORITY);

    this.bpmnRenderer = bpmnRenderer;
    this.textRenderer = textRenderer;
  }

  canRender(element) {
    return is(element, "bpmn:Task");
  }

  drawShape(parentNode, element) {
    const shape = this.bpmnRenderer.drawShape(parentNode, element);
    svgRemove(svgSelect(parentNode, ".djs-label"));
    this.renderEmbeddedDurationLabel(parentNode, element, "right-top");
    this.renderEmbeddedLabel(parentNode, element, "center-middle");
    return shape;
  }

  renderEmbeddedDurationLabel(parentGfx, element, align) {
    let semantic = getSemantic(element);

    if (semantic.duration) {
      var duration = "🕒:" + semantic.duration;
    } else {
      duration = "";
    }

    return this.renderLabel(parentGfx, duration, {
      box: element,
      align: align,
      padding: 2,
      style: {
        fill: getLabelColor(element),
      },
    });
  }

  renderEmbeddedLabel(parentGfx, element, align) {
    let semantic = getSemantic(element);
    var displayedText = "";

    if (semantic.role) {
      displayedText = displayedText + semantic.role.name;
    }
    if (semantic.NoP) {
      if (semantic.role) {
        displayedText = displayedText + " ";
      }
      displayedText = displayedText + "(" + semantic.NoP + ")";
    }
    if (semantic.name) {
      if (semantic.role || semantic.NoP) {
        displayedText = displayedText + "\n: ";
      }
      displayedText = displayedText + semantic.name;
    }

    element.businessObject.name = displayedText;

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

TaskRenderer.$inject = ["eventBus", "bpmnRenderer", "textRenderer"];
