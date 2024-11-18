import {Objective} from "./Objective";
import {ExecutionState} from "../executionState/ExecutionState";

export class Goal {
    objectives: Objective[];

    public constructor(objectives: Objective[] = []) {
        this.objectives = objectives;
    }

    isFulfilledBy(node: ExecutionState) {
        for (let i = 0; i < this.objectives.length; i++) {
            if (!node.objectives[i]) {
                if (this.objectives[i].isFulfilledBy(node)) {
                    node.objectives[i] = true;
                } else {
                    return false;
                }
            }
        }
        return true;
    }
}