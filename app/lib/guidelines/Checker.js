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
        this.hiddenSeverities = {};
    }
    
    getViolatedGuidelinesOfSeverity(severity) {
        const violatedGuidelines = Object.keys(this.errorList).map(guidelineId => guidelinePerId[guidelineId]);
        return violatedGuidelines.filter(guideline => guideline.severity === severity);
    }
    
    getViolationsOfSeverity(severity) {
        return this.getViolatedGuidelinesOfSeverity(severity).flatMap(guideline => this.errorList[guideline.id]);
    }

    reevaluateGuideline(guideline) {
        this.clearViolations(guideline);
        const violations = guideline.getViolations(this.mediator);
        violations.forEach(({element, message, gfx}) => {
            if (!element.violations) {
                element.violations = {};
            }
            element.violations[guideline.id] = message;
            this.highlightViolation(gfx, guideline.severity)
        });
        this.errorList[guideline.id] = violations;
        this.repopulateErrorBar();
    }

    clearViolations(guideline) {
        this.errorList[guideline.id]?.forEach(({element, gfx}) => {
            delete element.violations[guideline.id];
            this.unhighlightViolation(element, gfx, guideline.severity)
        });
    }
    
    highlightViolation(gfx, severity) {
        gfx.classList.add(severity.cssClass);
        gfx.classList.add('highlightedElement');
    }
    
    unhighlightViolation(element, gfx, severity) {
        const violatedGuidelines = Object.keys(element.violations || {});
        if (this.hiddenSeverities[severity.key] || violatedGuidelines.filter(guidelineId => guidelinePerId[guidelineId].severity === severity).length === 0) {
            gfx.classList.remove(severity.cssClass);
        }

        if (SEVERITY.filter(severity => gfx.classList.contains(severity.cssClass)) === 0) {
            gfx.classList.remove('highlightedElement');
        }
    }

    evaluateAll() {
        guidelines.forEach(guideline => this.reevaluateGuideline(guideline));
    }

    repopulateErrorBar() {
        this.errorBar.clear();
        SEVERITY.forEach(severity => {
            const violatedGuidelinesOfSeverity = this.getViolatedGuidelinesOfSeverity(severity);
            if (!this.hiddenSeverities[severity.key]) {
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
            }
            const numberOfViolations = violatedGuidelinesOfSeverity.reduce((sum, guideline) => sum + this.errorList[guideline.id].length, 0);
            const violationDisplay = this.errorBar.displayNumberOfViolations(severity, numberOfViolations);
            if (!this.hiddenSeverities[severity.key]) {
                violationDisplay.classList.add('strong')
            }
            violationDisplay.addEventListener('click', event => {
                this.hiddenSeverities[severity.key] = !this.hiddenSeverities[severity.key];
                const violationsOfSeverity = this.getViolationsOfSeverity(severity);
                if (!this.hiddenSeverities[severity.key]) {
                    violationsOfSeverity.forEach(({gfx}) => this.highlightViolation(gfx, severity));
                } else {
                    violationsOfSeverity.forEach(({gfx, element}) => this.unhighlightViolation(element, gfx, severity));
                }
                this.repopulateErrorBar();
            });
        });
    }

}