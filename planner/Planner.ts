import {Activity} from "./types/fragments/Activity";
import {ExecutionState} from "./types/executionState/ExecutionState";
import {Schedule} from "./types/output/Schedule";
import {Goal} from "./types/goal/Goal";

export class Planner {
    startState: ExecutionState;
    goal: Goal;
    activities: Activity[];

    public constructor(startState: ExecutionState, goal: Goal, activities: Activity[]) {
        this.startState = startState;
        this.goal = goal;
        this.activities = activities;
    }

    public generatePlan(): Schedule {
        this.setUpStartState(this.startState);
        let queue: ExecutionState[] = [this.startState];
        while (queue.length > 0) {
            let node = queue.shift();
            if (this.goal.isFulfilledBy(node!)) {
                return new Schedule(node!.scheduledActions, node!.allStateInstances().map(stateInstance =>
                    stateInstance.instance), node!.resources
                );
            }
            let newNodes = node!.getSuccessors(this.activities);
            queue.push(...newNodes);
        }
        return new Schedule();
    }

    private setUpStartState(startState: ExecutionState) {
        this.goal.objectives.forEach(() => {
            startState.objectives.push(false);
        });
    }
}