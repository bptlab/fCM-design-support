import {Resource} from "../Resource";
import {ExecutionState} from "./ExecutionState";
import {ScheduledAction} from "../output/ScheduledAction";
import {InstanceLink} from "./InstanceLink";
import {Activity} from "../fragments/Activity";
import {StateInstance} from "./StateInstance";

export class Action {
    activity: Activity;
    runningTime: number;
    resource: Resource | null;
    inputList: StateInstance[];
    outputList: StateInstance[];
    addedInstanceLinks: InstanceLink[];

    public constructor(activity: Activity, runningTime: number, resource: Resource | null, inputList: StateInstance[],
                       outputList: StateInstance[], addedInstanceLinks: InstanceLink[]) {
        this.activity = activity;
        this.runningTime = runningTime;
        this.resource = resource;
        this.inputList = inputList;
        this.outputList = outputList;
        this.addedInstanceLinks = addedInstanceLinks;
    }

    public start(executionState: ExecutionState): ExecutionState {
        if (this.activity.duration == 0) {
            return this.finishInstantAction(executionState);
        }
        let changedStateInstances: StateInstance[] = this.getChangedExecutionDataObjectInstances();
        let availableStateInstances: StateInstance[] = executionState.availableStateInstances.filter(executionDataObjectInstance =>
            !changedStateInstances.some(it => it.instance === executionDataObjectInstance.instance)
        );
        let blockedStateInstances: StateInstance[] = executionState.blockedStateInstances.concat(changedStateInstances);
        let instanceLinks: InstanceLink[] = executionState.instanceLinks;
        let resources: Resource[] = this.getBlockedResources(executionState.resources);
        let time: number = executionState.time;
        let runningActions: Action[] = executionState.runningActions.concat([this]);
        let scheduledActions: ScheduledAction[] = executionState.scheduledActions;
        let objectiveArray: boolean[] = executionState.objectives.slice();
        return new ExecutionState(availableStateInstances, blockedStateInstances, instanceLinks, resources, time, runningActions, scheduledActions, objectiveArray);
    }

    private getBlockedResources(resources: Resource[]): Resource[] {
        if (this.resource === null) {
            return resources;
        }
        let blockedResources: Resource[] = resources.filter(resource => resource !== this.resource);
        let changedResource: Resource = new Resource(this.resource.id, this.resource.name, this.resource.roles, this.resource.capacity - this.activity.NoP, this.resource.availabilityStart, this.resource.availabilityEnd);
        blockedResources.push(changedResource);
        return blockedResources;
    }

    private canFinish(): boolean {
        return this.runningTime + 1 == this.activity.duration;
    }


    public tryToFinish(executionState: ExecutionState): ExecutionState {
        if (this.canFinish()) {
            return this.finish(executionState);
        } else {
            let action: Action = new Action(this.activity, this.runningTime + 1, this.resource, this.inputList, this.outputList, this.addedInstanceLinks);
            let runningActions: Action[] = executionState.runningActions.filter(action => action !== this);
            runningActions.push(action);
            return new ExecutionState(executionState.availableStateInstances, executionState.blockedStateInstances,
                executionState.instanceLinks, executionState.resources, executionState.time, runningActions, executionState.scheduledActions, executionState.objectives
            );
        }
    }

    private finish(executionState: ExecutionState): ExecutionState {
        let availableStateInstances: StateInstance[] = this.outputList.concat(executionState.availableStateInstances);
        let blockedStateInstances: StateInstance[] = this.getNewBlockedStateInstances(executionState);
        let instanceLinks: InstanceLink[] = this.addedInstanceLinks.concat(executionState.instanceLinks);
        let resources: Resource[] = this.getNewResources(executionState);
        let time: number = executionState.time;
        let runningActions: Action[] = executionState.runningActions.filter(action => action !== this);
        let scheduledActions: ScheduledAction[] = this.getNewScheduledActions(executionState);
        let objectiveArray: boolean[] = executionState.objectives.slice();
        return new ExecutionState(availableStateInstances, blockedStateInstances, instanceLinks, resources, time, runningActions, scheduledActions, objectiveArray);
    }

    private getNewBlockedStateInstances(executionState: ExecutionState): StateInstance[] {
        let changedStateInstances: StateInstance[] = this.getChangedExecutionDataObjectInstances();
        return executionState.blockedStateInstances.filter(stateInstance =>
            !changedStateInstances.some(it => it.instance === stateInstance.instance)
        );
    }

    private getNewResources(executionState: ExecutionState): Resource[] {
        let oldResources: Resource[] = executionState.resources;
        return oldResources.map(resource => {
            if (resource.name === this.resource?.name && resource.roles === this.resource?.roles) {
                return new Resource(resource.id, resource.name, resource.roles, resource.capacity + this.activity.NoP, resource.availabilityStart, resource.availabilityEnd);
            } else {
                return resource;
            }
        });
    }

    private getNewScheduledActions(executionState: ExecutionState): ScheduledAction[] {
        let oldActionHistory = executionState.scheduledActions;
        return oldActionHistory.concat(
            new ScheduledAction(this.activity, executionState.time - this.activity.duration, executionState.time, this.resource, this.activity.NoP,
                this.inputList.slice(),
                this.outputList.slice()
            )
        );
    }

    private getChangedExecutionDataObjectInstances(): StateInstance[] {
        let changedExecutionDataObjectInstances: StateInstance[] = [];
        for (let input of this.inputList) {
            if (this.outputList.some(output => output.instance === input.instance)) {
                changedExecutionDataObjectInstances.push(input);
            }
        }
        return changedExecutionDataObjectInstances;
    }

    private finishInstantAction(executionState: ExecutionState): ExecutionState {
        let changedExecutionDataObjectInstances = this.getChangedExecutionDataObjectInstances();
        let availableDataObjects = executionState.availableStateInstances.filter(executionDataObjectInstance => !changedExecutionDataObjectInstances.some(it => it.instance === executionDataObjectInstance.instance));
        availableDataObjects = availableDataObjects.concat(this.outputList);
        let blockedDataObjects = executionState.blockedStateInstances.slice();
        let instanceLinks = executionState.instanceLinks.concat(this.addedInstanceLinks);
        let resources = executionState.resources.slice();
        let time = executionState.time;
        let runningActions = executionState.runningActions.slice();
        let actionHistory = this.getNewScheduledActions(executionState);
        let objectiveArray = executionState.objectives.slice();
        return new ExecutionState(availableDataObjects, blockedDataObjects, instanceLinks, resources, time, runningActions, actionHistory, objectiveArray);
    }
}