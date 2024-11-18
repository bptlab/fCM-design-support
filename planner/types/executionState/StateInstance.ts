import {Instance} from "./Instance";

export class StateInstance {
    instance: Instance;
    state: string;

    public constructor(instance: Instance, state: string) {
        this.instance = instance;
        this.state = state;
    }
}