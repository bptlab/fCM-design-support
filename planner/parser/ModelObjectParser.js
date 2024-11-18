import {is} from "bpmn-js/lib/util/ModelUtil";
import {StateInstance} from "../../dist/types/executionState/StateInstance";
import {InstanceLink} from "../../dist/types/executionState/InstanceLink";
import {ExecutionState} from "../../dist/types/executionState/ExecutionState";
import {DataObjectReference} from "../../dist/types/fragments/DataObjectReference";
import {IOSet} from "../../dist/types/fragments/IOSet";
import {Resource} from "../../dist/types/Resource";
import {Instance} from "../../dist/types/executionState/Instance";
import {Goal} from "../../dist/types/goal/Goal";
import {Role} from "../../dist/types/Role";
import {ObjectiveLink} from "../../dist/types/goal/ObjectiveLink";
import {ObjectiveObject} from "../../dist/types/goal/ObjectiveObject";
import {Objective} from "../../dist/types/goal/Objective";
import {Activity} from "../../dist/types/fragments/Activity";
import {Planner} from "../../dist/Planner";
import {Dataclass} from "../../dist/types/Dataclass";
import {cartesianProduct} from "../../dist/Util";

export class ModelObjectParser {
    constructor(dataModeler, fragmentModeler, objectiveModeler, dependencyModeler, roleModeler, resourceModeler) {
        this.dataclasses = this.parseDataclasses(dataModeler);
        this.roles = this.parseRoles(roleModeler);
        this.resources = this.parseResources(resourceModeler, this.roles);
        this.activities = this.parseActivities(fragmentModeler, this.dataclasses, this.roles);
        this.instances = this.parseInstances(objectiveModeler, this.dataclasses);
        this.currentState = this.parseCurrentState(objectiveModeler, resourceModeler, this.resources, this.instances);
        this.objectives = this.parseObjectives(objectiveModeler, dependencyModeler, this.instances);
        this.goal = new Goal(this.objectives);
    }

    createPlanner() {
        return new Planner(this.currentState, this.goal, this.activities);
    }

    parseDataclasses(dataModeler) {
        let dataclasses = [];
        let modelDataclasses = dataModeler._definitions.get('rootElements').map(element =>
            element.get('boardElements')
        ).flat().filter(element => is(element, 'od:Class'));

        for (let dataclass of modelDataclasses) {
            dataclasses.push(new Dataclass(dataclass.id, dataclass.name));
        }
        return dataclasses;
    }

    parseRoles(roleModeler) {
        let roles = [];
        let modelRoles = roleModeler._definitions.get('rootElements').map(element =>
            element.get('boardElements')
        ).flat().filter(element => is(element, 'rom:Role'));

        for (let role of modelRoles) {
            roles.push(new Role(role.id, role.name));
        }
        return roles;
    }

    parseResources(resourceModeler, roles) {
        let resources = [];
        let modelResources = resourceModeler._definitions.get('rootElements').map(element =>
            element.get('boardElements')
        ).flat().filter(element => is(element, 'rem:Resource'));

        for (let resource of modelResources) {
            let rolePlanReferences = [];
            for (let roleModelReference of resource.roles) {
                rolePlanReferences.push(roles.find(role => role.id === roleModelReference.id));
            }
            resources.push(new Resource(resource.id, resource.name, rolePlanReferences,
                getNumber(resource.capacity, 1), getNumber(resource.availabilityStart, 0),
                getNumber(resource.availabilityEnd, Infinity))
            );
        }
        return resources
    }

    parseInstances(objectiveModeler, dataclasses) {
        let instances = [];
        let modelInstances = objectiveModeler._definitions.get('objectInstances').filter(element =>
            is(element, 'om:ObjectInstance')
        );

        for (let instance of modelInstances) {
            instances.push(new Instance(instance.id, instance.name, dataclasses.find(dataclass =>
                dataclass.id === instance.classRef.id
            )))
        }
        return instances
    }

    parseObjectives(objectiveModeler, dependencyModeler, instances) {
        let objectives = [];
        let dependencyLinks = dependencyModeler._definitions.get('goals')[0].get('Elements').filter(element =>
            is(element, 'dep:Dependency')
        );
        let modelObjectives = objectiveModeler._definitions.get('rootElements');

        for (let i = 0; i < modelObjectives.length; i++) {
            let objectiveBoardId = modelObjectives[i].id;
            let objectiveId = objectiveModeler._definitions.get('rootBoards').find(element =>
                element.plane.get('boardElement').id === objectiveBoardId
            ).objectiveRef.id;

            let objectiveObjects = [];
            for (let object of modelObjectives[i].get('boardElements').filter(element => is(element, 'om:Object'))) {
                objectiveObjects.push(new ObjectiveObject(object.id, instances.find(instance =>
                        instance.id === object.instance.id && instance.dataclass.id === object.classRef.id),
                    object.states.map(state => state.name)));
            }
            let objectiveLinks = [];
            for (let link of modelObjectives[i].get('boardElements').filter(element => is(element, 'om:Link'))) {
                objectiveLinks.push(new ObjectiveLink(link.id, objectiveObjects.find(objectiveObject =>
                        objectiveObject.instance.id === link.sourceRef.instance.id &&
                        objectiveObject.instance.dataclass.id === link.sourceRef.classRef.id),
                    objectiveObjects.find(objectiveObject =>
                        objectiveObject.instance.id === link.targetRef.instance.id &&
                        objectiveObject.instance.dataclass.id === link.targetRef.classRef.id
                    ))
                );
            }

            if (objectiveId === 'start_state') {
                objectives.push(new Objective(objectiveId, objectiveObjects, objectiveLinks,
                    getNumber(objectiveModeler._definitions.get('rootBoards')[i].objectiveRef?.date, null)
                ));
            } else {
                let previousObjectiveId = dependencyLinks.find(dependencyLink =>
                    dependencyLink.targetObjective.id === objectiveId
                ).sourceObjective.id;
                let index = objectives.findIndex(objective => objective.id === previousObjectiveId);
                if (index === -1) {
                    objectives.push(new Objective(objectiveId, objectiveObjects, objectiveLinks,
                        parseInt(objectiveModeler._definitions.get('rootBoards')[i].objectiveRef?.date)
                    ));
                } else {
                    objectives.splice(index + 1, 0,
                        new Objective(objectiveId, objectiveObjects, objectiveLinks,
                            parseInt(objectiveModeler._definitions.get('rootBoards')[i].objectiveRef?.date)
                        )
                    );
                }
            }
        }
        return objectives;
    }

    parseCurrentState(objectiveModeler, resourceModeler, resources, instances) {
        let startState = objectiveModeler._definitions.get('rootElements').find(element => element.id === "Board");
        let stateInstances = [];
        for (let stateInstance of startState.get('boardElements').filter(element => is(element, 'om:Object'))) {
            stateInstances.push(new StateInstance(instances.find(instance =>
                instance.id === stateInstance.instance.id &&
                instance.dataclass.id === stateInstance.classRef.id
            ), stateInstance.states[0].name));
        }
        let instanceLinks = [];
        for (let instanceLink of startState.get('boardElements').filter(element => is(element, 'om:Link'))) {
            instanceLinks.push(new InstanceLink(instances.find(instance =>
                    instance.id === instanceLink.sourceRef.instance.id &&
                    instance.dataclass.id === instanceLink.sourceRef.classRef.id),
                instances.find(instance =>
                    instance.id === instanceLink.targetRef.instance.id &&
                    instance.dataclass.id === instanceLink.targetRef.classRef.id
                )
            ));
        }
        return new ExecutionState(stateInstances, [], instanceLinks, resources, 0, [], [], []);
    }

    parseActivities(fragmentModeler, dataclasses, roles) {
        let activities = [];
        let modelActivities = fragmentModeler._definitions.get('rootElements')[0].get('flowElements').filter(element =>
            is(element, 'bpmn:Task')
        );

        for (let activity of modelActivities) {
            let inputSets = [];
            for (let dataObjectReference of activity.get('dataInputAssociations')) {
                let dataObjectReferences = [];
                for (let i = 0; i < dataObjectReference.get('sourceRef')[0].states.length; i++) {
                    dataObjectReferences.push(new DataObjectReference(dataclasses.find(dataclass =>
                        dataclass.id === dataObjectReference.get('sourceRef')[0].dataclass.id
                    ), dataObjectReference.get('sourceRef')[0].states[i].name, false));
                }
                inputSets.push(dataObjectReferences);
            }
            if (inputSets.length === 0) {
                inputSets.push([]);
            } else {
                inputSets = cartesianProduct(...inputSets);
            }

            let outputSet = [];
            for (let dataObjectReference of activity.get('dataOutputAssociations')) {
                outputSet.push(new DataObjectReference(dataclasses.find(dataclass =>
                    dataclass.id === dataObjectReference.get('targetRef').dataclass.id
                ), dataObjectReference.get('targetRef').states[0].name, false));
            }

            for (let inputSet of inputSets) {
                activities.push(new Activity(activity.name, getNumber(activity.duration, 0),
                    getNumber(activity.NoP, 1), roles.find(role => role.id === activity.role?.id),
                    new IOSet([].concat(inputSet)), new IOSet(outputSet))
                );
            }
        }
        return activities;
    }
}

function getNumber(value, defaultValue) {
    let num = parseInt(value, 10)
    return isNaN(num) ? defaultValue : num;
}