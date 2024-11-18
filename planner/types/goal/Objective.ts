import {ObjectiveObject} from "./ObjectiveObject";
import {ObjectiveLink} from "./ObjectiveLink";
import {ExecutionState} from "../executionState/ExecutionState";

export class Objective {
    id: string;
    objectiveObjects: ObjectiveObject[];
    objectiveLinks: ObjectiveLink[];
    deadline: number | null;

    public constructor(id: string, objectiveObjects: ObjectiveObject[], objectiveLinks: ObjectiveLink[], deadline: number | null = null) {
        this.id = id;
        this.objectiveObjects = objectiveObjects;
        this.objectiveLinks = objectiveLinks;
        this.deadline = deadline;
    }

    public isFulfilledBy(executionState: ExecutionState) {
        if (this.deadline && executionState.time > this.deadline) {
            return false;
        }
        for (let objectiveObject of this.objectiveObjects) {
            if (!executionState.allStateInstances().some(stateInstance => objectiveObject.isMatchedBy(stateInstance))) {
                return false;
            }
        }
        for (let objectiveLink of this.objectiveLinks) {
            if (!executionState.instanceLinks.some(instanceLink => objectiveLink.isMatchedBy(instanceLink))) {
                return false;
            }
        }
        return true;
    }
}