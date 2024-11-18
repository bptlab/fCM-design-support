import {ScheduledAction} from "./ScheduledAction";
import {Instance} from "../executionState/Instance";
import {Resource} from "../Resource";

export class Schedule {
    scheduledActions: ScheduledAction[];
    instances: Instance[];
    resources: Resource[];

    public constructor(scheduledActions: ScheduledAction[] = [], instances: Instance[] = [], resources: Resource[] = []) {
        this.scheduledActions = scheduledActions;
        this.instances = instances;
        this.resources = resources;
    }
}