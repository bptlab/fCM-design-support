import {DataObjectReference} from "./DataObjectReference";
import {StateInstance} from "../executionState/StateInstance";

export class IOSet {
    set: DataObjectReference[];

    public constructor(set: DataObjectReference[]) {
        this.set = set;
    }

    public isSatisfiedBy(stateInstances: StateInstance[]): boolean {
        for (let dataObjectReference of this.set) {
            let foundMatchingStateInstance: boolean = false;
            for (let stateInstance of stateInstances) {
                if (dataObjectReference.isMatchedBy(stateInstance)) {
                    foundMatchingStateInstance = true;
                    break;
                }
            }
            if (!foundMatchingStateInstance) {
                return false;
            }
        }
        return true;
    }
}