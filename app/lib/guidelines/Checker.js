import { is } from "bpmn-js/lib/util/ModelUtil";
import { root } from "../util/Util";
import Guidelines from "./Guidelines";
import { SEVERITY } from "./Guidelines";

const guidelines = Guidelines;
const guidelinePerId = {}; guidelines.forEach(guideline => guidelinePerId[guideline.id] = guideline);

export default class Checker {
    constructor(mediator, errorBar) {
        this.errorList = {};
        this.mediator = mediator;
        mediator.executed(['shape.create', 'shape.delete', 'element.updateLabel'], event => {
            this.evaluateAll();
        });
        this.errorBar = errorBar;
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
            gfx.classList.add('highlightedElement');
        });
        this.errorList[guideline.id] = violations;
        this.repopulateErrorBar();
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
                if (violatedGuidelines.length === 0) {
                    gfx.classList.remove('highlightedElement');
                }
            });
        });
    }

    evaluateAll() {
        guidelines.forEach(guideline => this.reevaluateGuideline(guideline));
    }

    repopulateErrorBar() {
        this.errorBar.clear();
        const violatedGuidelines = Object.keys(this.errorList);
        Object.keys(SEVERITY).forEach(key => {
            const severity = SEVERITY[key];
            const violatedGuidelinesOfSeverity = violatedGuidelines.map(guidelineId => guidelinePerId[guidelineId]).filter(guideline => guideline.severity === severity);
            violatedGuidelinesOfSeverity.forEach(guideline => {
                const violations = this.errorList[guideline.id];
                violations.forEach(({element, message, quickFixes, gfx}) => {
                    var artifact = undefined;
                    if (is(root(element), 'olc:Olc')) {
                        artifact = 'Olcs'
                    } else {
                        //TODO determine artifact
                    }

                    this.errorBar.displayRow({
                        severity: guideline.severity,
                        element,
                        artifact,
                        message,
                        link : guideline.link,
                        quickFixes
                    });
                });
            });
        });
    }

}