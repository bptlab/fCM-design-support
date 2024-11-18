import {is} from '../common/util/ModelUtil';

export function getConnectedElements(element) {

    let visited = [];

    function visit(element) {
        if (visited.includes(element)) {
            return;
        }
        visited.push(element);

        element.incoming.forEach(flow => {
            visit(flow.source);
        });
        element.outgoing.forEach(flow => {
            visit(flow.target);
        });
    }

    visit(element);

    return visited;
}

export function getConnectedByExistentialAssociation(caseClass, classDependents) {

    let visited = [];

    function visit(element) {
        if (visited.includes(element)) {
            return;
        }
        visited.push(element);
        (classDependents[element.id] || []).forEach(visit);
    }

    visit(caseClass);

    return visited;
}


/**
 * Get for each class the other classes that depend on it
 */
export function getClassDependents(mediator) {
    const classDependents = {};

    function addClassDependent(dependentClass, contextClass) {
        if (!classDependents[contextClass.id]) {
            classDependents[contextClass.id] = [];
        }
        classDependents[contextClass.id].push(dependentClass);
    }

    forEachExistentialAssociation(mediator, addClassDependent);

    return classDependents;
}

/**
 * Get for each class the other classes that it depends on
 */
export function getClassDependencies(mediator) {
    const classDependencies = {};

    function addClassDependency(dependentClass, contextClass) {
        if (!classDependencies[dependentClass.id]) {
            classDependencies[dependentClass.id] = [];
        }
        classDependencies[dependentClass.id].push(contextClass);
    }

    forEachExistentialAssociation(mediator, addClassDependency);

    return classDependencies;
}

/**
 * Call handler for each existential association with parameters dependentClass and contextClass
 */
export function forEachExistentialAssociation(mediator, handler) {
    const dataModeler = mediator.dataModelerHook.modeler;
    const classDependencies = {};
    const associations = dataModeler.get('elementRegistry').filter(element => is(element, 'od:Association') && element.type !== 'label').map(association => association.businessObject);
    associations
        .filter(association => association.sourceCardinality && association.targetCardinality) // TODO this is an hotfix
        .forEach(association => {
            const [sourceLowerBound, sourceUpperBound] = association.sourceCardinality.split('..');
            const [targetLowerBound, targetUpperBound] = association.targetCardinality.split('..');
            if (parseInt(sourceLowerBound) > 0) {
                // The lower bound for the association source class is positive, which means the target class is dependent of it
                handler(association.targetRef, association.sourceRef);
            }
            if (parseInt(targetLowerBound) > 0) {
                // The lower bound for the association target class is positive, which means the source class is dependent of it
                handler(association.sourceRef, association.targetRef);
            }
        });

    return classDependencies;
}