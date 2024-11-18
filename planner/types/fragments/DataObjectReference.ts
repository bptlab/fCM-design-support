import {Dataclass} from "../Dataclass";
import {StateInstance} from "../executionState/StateInstance";

export class DataObjectReference {
    dataclass: Dataclass;
    state: string;
    isList: boolean;

    public constructor(dataclass: Dataclass, state: string, isList: boolean) {
        this.dataclass = dataclass;
        this.state = state;
        this.isList = isList;
    }

    public isMatchedBy(stateInstance: StateInstance) {
        return this.dataclass === stateInstance.instance.dataclass && this.state === stateInstance.state;
    }
}