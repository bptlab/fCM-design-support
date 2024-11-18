import Guidelines, {SEVERITY} from "./Guidelines";
import getDropdown from "../util/Dropdown";
import OlcEvents from '../olcmodeler/OlcEvents';
import TerminationConditionEvents from "../terminationconditionmodeler/TerminationConditionEvents";
import {openAsOverlay} from "../util/HtmlUtil";
import {makeGuidelineLink, makeQuickFixDiv} from "./ErrorBar";

const guidelines = Guidelines;
const guidelinePerId = {};
guidelines.forEach(guideline => guidelinePerId[guideline.id] = guideline);

export default class Checker {
    constructor(mediator, errorBar) {
        this.errorList = {};
        this.mediator = mediator;
        // ToDo: Might be worthwhile to assign guidelines to specific events - avoiding evaluating all guidelines every time
        mediator.executed(['shape.create', 'shape.delete', 'element.updateLabel', 'connection.create', 'connection.delete', 'element.updateProperties'], event => {
            this.evaluateAll();
        });
        mediator.on([OlcEvents.SELECTED_OLC_CHANGED, TerminationConditionEvents.TERMINATIONCONDITION_CHANGED], event => {
            this.evaluateAll();
        });
        this.errorBar = errorBar;
        this.hiddenSeverities = {};
        this.messageDropdown = getDropdown();
        this.messageDropdown.classList.remove("dd-dropdown-menu");
        this.messageDropdown.classList.add("dd-dropdown-menu-warnings");
        mediator.on(['element.click', 'create.start'], event => {
            this.hideDropdowns();
        });

        // Initially deactivate for imports etc.
        this.deactivate();
    }

    activate() {
        this.active = true;
        this.evaluateAll();
    }

    deactivate() {
        guidelines.forEach(guideline => this.clearViolations(guideline));
        this.active = false;
    }

    getViolatedGuidelinesOfSeverity(severity) {
        const violatedGuidelines = Object.keys(this.errorList).map(guidelineId => guidelinePerId[guidelineId]);
        return violatedGuidelines.filter(guideline => guideline.severity === severity);
    }

    getViolationsOfSeverity(severity) {
        return this.getViolatedGuidelinesOfSeverity(severity).flatMap(guideline => this.errorList[guideline.id]);
    }

    getElementViolationsOfSeverity(element, severity) {
        return Object.keys(element.violations).filter(key => guidelinePerId[key].severity === severity).reduce((obj, key) => {
            obj[key] = element.violations[key];
            return obj;
        }, {});
    }

    reevaluateGuideline(guideline) {
        this.clearViolations(guideline);
        const violations = guideline.getViolations(this.mediator);
        violations.forEach(violation => {
            const element = violation.element;
            if (!element.violations) {
                element.violations = {};
            }
            element.violations[guideline.id] = violation;
            this.highlightViolation(element, guideline.severity);
        });
        this.errorList[guideline.id] = violations;
        this.repopulateErrorBar();
    }

    clearViolations(guideline) {
        this.errorList[guideline.id]?.forEach(({element}) => {
            delete element.violations[guideline.id];
            this.unhighlightViolation(element, guideline.severity)
        });
        delete this.errorList[guideline.id];
    }

    highlightViolation(element, severity) {
        const gfx = this.getGraphics(element);
        if (!gfx || this.hiddenSeverities[severity.key]) {
            return
        }
        gfx.classList.add(severity.cssClass);
        gfx.classList.add('highlightedElement');

        if (!element.markerContainer) {
            this.createMarkerContainer(element)
        }
        if (!element.markers) {
            element.markers = {};
        }
        if (!element.markers[severity.key]) {
            element.markers[severity.key] = this.createMarkerForSeverity(element, severity);
            element.markerContainer.appendChild(element.markers[severity.key]);
        }
        this.updateSeverityCount(element, severity);
    }

    createMarkerContainer(element) {
        const hook = this.mediator.getHookForElement(element);
        const modeler = hook.modeler;
        element.markerContainer = document.createElement('div');
        element.markerContainer.classList.add('markerContainer');

        if (element !== hook.getRootObject()) {
            modeler.get('overlays').add(element.id, 'violationMarkers', {
                position: {
                    bottom: 0,
                    right: 0
                },
                html: element.markerContainer
            });
        } else {
            element.markerContainer.style.bottom = 0;
            element.markerContainer.style.right = 0;
            element.markerContainer.style.position = 'absolute';
            this.getGraphics(element).appendChild(element.markerContainer);
        }
    }

    createMarkerForSeverity = (element, severity) => {
        const marker = document.createElement('div');
        marker.classList.add('violationMarker');
        marker.classList.add(severity.cssClass);
        marker.addEventListener('click', event => {
            this.openMessageDropdown(event, this.getElementViolationsOfSeverity(element, severity));
        });
        return marker;
    }

    openMessageDropdown = (event, violations) => {
        this.hideDropdowns();
        this.messageDropdown.populate(Object.keys(violations), (guideline, element, event) => {
            event.stopPropagation();
        }, undefined, (guideline) => violations[guideline].message);
        this.messageDropdown.getEntries().forEach(entry => {
            entry.classList.add('unclickable');
            const quickFixes = violations[entry.option].quickFixes;
            entry.appendChild(makeGuidelineLink(guidelinePerId[entry.option].link));
            if (quickFixes && quickFixes.length > 0) {
                entry.classList.add('hasQuickFixes');
                const quickFixDiv = makeQuickFixDiv(quickFixes);
                entry.appendChild(quickFixDiv);
            }
        });

        openAsOverlay(this.messageDropdown, event);
    }

    hideDropdowns = () => {
        this.messageDropdown.parentElement?.removeChild(this.messageDropdown);
    }

    unhighlightViolation(element, severity) {
        const hook = this.mediator.getHookForElement(element);
        const modeler = hook.modeler;
        const gfx = this.getGraphics(element);
        if (!gfx) { // Clean up until the element is shown again
            element.markerContainer = undefined;
            element.markers = undefined;
        }
        const violatedGuidelines = Object.keys(element.violations || {});
        if (element.markers) {
            if (this.hiddenSeverities[severity.key] || violatedGuidelines.filter(guidelineId => guidelinePerId[guidelineId].severity === severity).length === 0) {
                gfx.classList.remove(severity.cssClass);
                if (element.markers[severity.key]) { // There might be no marker because the element wasn't shown before
                    element.markerContainer.removeChild(element.markers[severity.key]);
                    element.markers[severity.key] = undefined;
                }

                if (SEVERITY.filter(severity => gfx.classList.contains(severity.cssClass)).length === 0) {
                    gfx.classList.remove('highlightedElement');
                    if (element !== hook.getRootObject()) {
                        modeler.get('overlays').remove({element: element.id, type: 'violationMarkers'});
                    } else {
                        this.getGraphics(element).removeChild(element.markerContainer);
                    }
                    element.markerContainer = undefined;
                }
            } else {
                if (element.markers[severity.key]) { // There might be no marker because the element wasn't shown before
                    this.updateSeverityCount(element, severity);
                }
            }
        }
    }

    getGraphics(element) {
        const hook = this.mediator.getHookForElement(element);
        return hook.getGraphics(element);
    }

    updateSeverityCount(element, severity) {
        element.markers[severity.key].innerHTML = Object.keys(this.getElementViolationsOfSeverity(element, severity)).length;
    }

    evaluateAll() {
        if (this.active) {
            guidelines.forEach(guideline => this.reevaluateGuideline(guideline));
        }
    }

    repopulateErrorBar() {
        this.errorBar.clear();
        SEVERITY.forEach(severity => {
            const violatedGuidelinesOfSeverity = this.getViolatedGuidelinesOfSeverity(severity);
            if (!this.hiddenSeverities[severity.key]) {
                violatedGuidelinesOfSeverity.forEach(guideline => {
                    const violations = this.errorList[guideline.id];
                    violations.forEach(({element, message, quickFixes}) => {
                        const artifact = this.mediator.getHookForElement(element).locationOfElement(element);
                        this.errorBar.displayRow({
                            severity: guideline.severity,
                            element,
                            artifact,
                            message,
                            link: guideline.link,
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
                    violationsOfSeverity.forEach(({element}) => this.highlightViolation(element, severity));
                } else {
                    violationsOfSeverity.forEach(({element}) => this.unhighlightViolation(element, severity));
                }
                this.repopulateErrorBar();
            });
        });
    }

}