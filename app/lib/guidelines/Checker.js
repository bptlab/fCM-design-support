import { is } from "bpmn-js/lib/util/ModelUtil";
import { root } from "../util/Util";
import Guidelines from "./Guidelines";
import { SEVERITY } from "./Guidelines";
import getDropdown from "../util/Dropdown";
import OlcEvents from '../olcmodeler/OlcEvents';

const guidelines = Guidelines;
const guidelinePerId = {}; guidelines.forEach(guideline => guidelinePerId[guideline.id] = guideline);

export default class Checker {
    constructor(mediator, errorBar) {
        this.errorList = {};
        this.mediator = mediator;
        mediator.executed(['shape.create', 'shape.delete', 'element.updateLabel'], event => {
            this.evaluateAll();
        });
        mediator.on([OlcEvents.SELECTED_OLC_CHANGED], event => {
            if (event.olc) {
                this.evaluateAll();
            }
        });
        this.errorBar = errorBar;
        this.hiddenSeverities = {};
        this.messageDropdown = getDropdown();
        mediator.on(['element.click', 'create.start'], event => {
            this.hideDropdowns();
        });
    }
    
    getViolatedGuidelinesOfSeverity(severity) {
        const violatedGuidelines = Object.keys(this.errorList).map(guidelineId => guidelinePerId[guidelineId]);
        return violatedGuidelines.filter(guideline => guideline.severity === severity);
    }
    
    getViolationsOfSeverity(severity) {
        return this.getViolatedGuidelinesOfSeverity(severity).flatMap(guideline => this.errorList[guideline.id]);
    }

    getGuidelinesOfSeverity(guidelines, severity) {
        return Object.keys(guidelines).filter(key => guidelinePerId[key].severity === severity).reduce((obj, key) => {
            obj[key] = guidelines[key];
            return obj;
        }, {});
    }

    reevaluateGuideline(guideline) {
        this.clearViolations(guideline);
        const violations = guideline.getViolations(this.mediator);
        violations.forEach(({element, message}) => {
            if (!element.violations) {
                element.violations = {};
            }
            element.violations[guideline.id] = message;
            this.highlightViolation(element, guideline.severity)
        });
        this.errorList[guideline.id] = violations;
        this.repopulateErrorBar();
    }

    clearViolations(guideline) {
        this.errorList[guideline.id]?.forEach(({element}) => {
            delete element.violations[guideline.id];
            this.unhighlightViolation(element, guideline.severity)
        });
    }
    
    highlightViolation(element, severity) {
        const modeler = this.mediator.getHookForElement(element).modeler;
        const gfx = modeler.get('elementRegistry').getGraphics(element.id);
        if (!gfx) {return}
        gfx.classList.add(severity.cssClass);
        gfx.classList.add('highlightedElement');

        if (!element.markerContainer) {
            element.markerContainer = document.createElement('div');
            element.markerContainer.classList.add('markerContainer');
            modeler.get('overlays').add(element.id, 'violationMarkers', {
                position: {
                    bottom: 0,
                    right: 0
                },
                html: element.markerContainer
            });
        }
        if (!element.markers) {
            element.markers = {};
        }
        if (!element.markers[severity.key]) {
            element.markers[severity.key] = this.createMarkerForSeverity(element, severity);
            element.markerContainer.appendChild(element.markers[severity.key]);
        }
        element.markers[severity.key].innerHTML = Object.keys(this.getGuidelinesOfSeverity(element.violations, severity)).length;
    }

    createMarkerForSeverity = (element, severity) => {
        const marker = document.createElement('div');
        marker.classList.add('violationMarker');
        marker.classList.add(severity.cssClass);
        marker.addEventListener('click', event => {
            this.openMessageDropdown(marker, this.getGuidelinesOfSeverity(element.violations, severity));
        });
        return marker;
    }

    openMessageDropdown = (parent, violations) => {
        this.hideDropdowns();
        this.messageDropdown.populate(Object.keys(violations), (guideline, element, event) => {
            event.stopPropagation();
        }, parent, (guideline) => violations[guideline]);
        this.messageDropdown.style.display = 'block';
        parent.appendChild(this.messageDropdown);
    }

    hideDropdowns = () => {
        this.messageDropdown.parentElement?.removeChild(this.messageDropdown);
    }
    
    unhighlightViolation(element, severity) {
        const modeler = this.mediator.getHookForElement(element).modeler;
        const gfx = modeler.get('elementRegistry').getGraphics(element.id);
        if (!gfx) { // Clean up until the element is shown again
            element.markerContainer = undefined;
            element.markers = undefined;
        }
        const violatedGuidelines = Object.keys(element.violations || {});
        if (element.markers && (this.hiddenSeverities[severity.key] || violatedGuidelines.filter(guidelineId => guidelinePerId[guidelineId].severity === severity).length === 0)) {
            gfx.classList.remove(severity.cssClass);
            if (element.markers[severity.key]) { // There might be no marker because the element wasn't shown before
                element.markerContainer.removeChild(element.markers[severity.key]);
                element.markers[severity.key] = undefined;
            }

            if (SEVERITY.filter(severity => gfx.classList.contains(severity.cssClass)).length === 0) {
                gfx.classList.remove('highlightedElement');
                modeler.get('overlays').remove({ element: element.id, type: 'violationMarkers' });
                element.markerContainer = undefined;
            }
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
                    violations.forEach(({element, message, quickFixes}) => {
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
                    violationsOfSeverity.forEach(({element}) => this.highlightViolation(element, severity));
                } else {
                    violationsOfSeverity.forEach(({element}) => this.unhighlightViolation(element, severity));
                }
                this.repopulateErrorBar();
            });
        });
    }

}