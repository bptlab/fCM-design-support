import {Instance} from "../executionState/Instance";
import {StateInstance} from "../executionState/StateInstance";

export class ObjectiveObject {
    id: string;
    instance: Instance;
    states: string[];

    public constructor(id: string, instance: Instance, states: string[]) {
        this.id = id;
        this.instance = instance;
        this.states = states;
    }

    public isMatchedBy(stateInstance: StateInstance) {
        return this.instance.dataclass == stateInstance.instance.dataclass
            && this.instance.name == stateInstance.instance.name
            && this.states.includes(stateInstance.state);
    }
}