import {IOSet} from "./IOSet";
import {Resource} from "../Resource";
import {Instance} from "../executionState/Instance";
import {Action} from "../executionState/Action";
import {ExecutionState} from "../executionState/ExecutionState";
import {Role} from "../Role";
import {cartesianProduct} from "../../Util";
import {InstanceLink} from "../executionState/InstanceLink";
import {StateInstance} from "../executionState/StateInstance";

export class Activity {
    name: string;
    duration: number;
    NoP: number;
    role: Role | null;
    inputSet: IOSet;
    outputSet: IOSet;

    public constructor(name: string, duration: number = 1, NoP: number = 1, role: Role | null = null, inputSet: IOSet, outputSet: IOSet) {
        this.name = name;
        this.duration = duration;
        this.NoP = NoP;
        this.role = role;
        this.inputSet = inputSet;
        this.outputSet = outputSet;
    }

    public getActions(executionState: ExecutionState): Action[] {

        let actions: Action[] = [];
        let needsInput: boolean = this.inputSet.set.length > 0;
        let needsResources: boolean = this.role != null;

        if (!needsInput && !needsResources) {
            actions.push(this.getActionForInput([], null, executionState));
        } else if (!needsInput && needsResources) {
            let possibleResources: Resource[] = this.getPossibleResources(executionState);
            for (let resource of possibleResources) {
                actions.push(this.getActionForInput([], resource, executionState));
            }
        } else if (needsInput && !needsResources) {
            let inputs: any[] = this.getPossibleInputs(executionState);
            for (let input of inputs) {
                actions.push(this.getActionForInput([].concat(input), null, executionState));
            }
        } else {
            let inputs: any[] = this.getPossibleInputs(executionState);
            let possibleResources: Resource[] = this.getPossibleResources(executionState);
            for (let input of inputs) {
                for (let resource of possibleResources) {
                    actions.push(this.getActionForInput([].concat(input), resource, executionState));
                }
            }
        }
        return actions;
    }

    private getPossibleResources(executionState: ExecutionState) {
        return executionState.resources.filter(resource => resource.satisfies(this.role!, this.NoP, executionState.time, this.duration));
    }

    private getPossibleInputs(executionState: ExecutionState): any[] {
        let possibleStateInstances: StateInstance[][] = [];
        for (let dataObjectReference of this.inputSet.set) {
            let matchingStateInstances = executionState.availableStateInstances.filter(stateInstance =>
                dataObjectReference.isMatchedBy(stateInstance)
            );
            possibleStateInstances.push(matchingStateInstances);
        }
        return cartesianProduct(...possibleStateInstances);
    }


    private getActionForInput(inputList: StateInstance[], resource: Resource | null, executionState: ExecutionState) {
        let outputList = this.getOutputForInput(inputList, executionState);
        let addedLinks = this.getAddedLinks(inputList.map(input => input.instance), outputList.map(output => output.instance));
        return new Action(this, 0, resource, inputList, outputList, addedLinks);
    }

    private getOutputForInput(inputList: StateInstance[], executionState: ExecutionState): StateInstance[] {
        return this.outputSet.set.map(output => {
            let stateInstance: StateInstance | undefined = inputList.find(stateInstance =>
                stateInstance.instance.dataclass === output.dataclass
            );
            if (stateInstance) {
                return new StateInstance(stateInstance.instance, output.state);
            } else {
                let newInstance: Instance = executionState.getNewInstanceOfClass(output.dataclass);
                return new StateInstance(newInstance, output.state);
            }
        });
    }

    private getAddedLinks(inputList: Instance[], outputList: Instance[]): InstanceLink[] {
        let addedLinks: InstanceLink[] = [];
        let addedInstances: Instance[] = this.getAddedInstances(inputList, outputList);
        let readInstances: Instance[] = inputList.filter(inputEntry => !outputList.find(outputEntry => inputEntry.dataclass === outputEntry.dataclass));
        let allInstances: Instance[] = outputList.concat(readInstances);

        for (let addedInstance of addedInstances) {
            for (let instance of allInstances) {
                if (addedInstance != instance) {
                    addedLinks.push(new InstanceLink(addedInstance, instance));
                }
            }
        }

        return addedLinks;
    }

    private getAddedInstances(inputList: Instance[], outputList: Instance[]) {
        return outputList.filter(outputEntry => !inputList.find(inputEntry => inputEntry.dataclass === outputEntry.dataclass));
    }
}
