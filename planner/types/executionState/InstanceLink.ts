import {Instance} from "./Instance";

export class InstanceLink {
    first: Instance;
    second: Instance;

    public constructor(first: Instance, second: Instance) {
        this.first = first;
        this.second = second;
    }
}