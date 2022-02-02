import Guidelines from "./Guidelines";
import { SEVERITY } from "./Guidelines";

const guidelines = Guidelines;
const guidelinePerId = {}; guidelines.forEach(guideline => guidelinePerId[guideline.id] = guideline);

export default class Checker {
    constructor(mediator) {
        this.errorList = {};
        this.mediator = mediator;
        mediator.executed(['shape.create', 'shape.delete', 'element.updateLabel'], event => {
            this.evaluateAll();
        });
    }

    reevaluateGuideline(guideline) {
        this.clearViolations(guideline);
        const violations = guideline.getViolations(this.mediator);
        violations.forEach(({element, message, gfx}) => {
            if (!element.violations) {
                element.violations = {};
            }
            element.violations[guideline.id] = message;
            gfx.classList.add(guideline.severity.cssClass);
        });
        this.errorList[guideline.id] = violations;
    }

    clearViolations(guideline) {
        this.errorList[guideline.id]?.forEach(({element, gfx}) => {
            delete element.violations[guideline.id];
            const violatedGuidelines = Object.keys(element.violations);
            Object.keys(SEVERITY).forEach(key => {
                const severity = SEVERITY[key];
                if (violatedGuidelines.filter(guidelineId => guidelinePerId[guidelineId].severity === severity).length === 0) {
                    gfx.classList.remove(severity.cssClass);
                }
            });
        });
    }

    evaluateAll() {
        guidelines.forEach(guideline => this.reevaluateGuideline(guideline));
    }

}