import {ObjectiveObject} from "./ObjectiveObject";
import {InstanceLink} from "../executionState/InstanceLink";

export class ObjectiveLink {
    id: string;
    first: ObjectiveObject;
    second: ObjectiveObject;

    public constructor(id: string, first: ObjectiveObject, second: ObjectiveObject) {
        this.id = id;
        this.first = first;
        this.second = second;
    }

    public isMatchedBy(instanceLink: InstanceLink) {
        return (this.first.instance === instanceLink.first && this.second.instance === instanceLink.second)
            || (this.second.instance === instanceLink.first && this.first.instance === instanceLink.second);
    }
}