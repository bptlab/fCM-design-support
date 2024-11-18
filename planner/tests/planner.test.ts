import {Instance} from "../types/executionState/Instance";
import {ExecutionState} from "../types/executionState/ExecutionState";
import {IOSet} from "../types/fragments/IOSet";
import {DataObjectReference} from "../types/fragments/DataObjectReference";
import {Role} from "../types/Role";
import {Resource} from "../types/Resource";
import {Dataclass} from "../types/Dataclass";
import {Planner} from "../Planner";
import {Objective} from "../types/goal/Objective";
import {ObjectiveObject} from "../types/goal/ObjectiveObject";
import {Goal} from "../types/goal/Goal";
import {Activity} from "../types/fragments/Activity";
import {StateInstance} from "../types/executionState/StateInstance";
import {Schedule} from "../types/output/Schedule";
import {ScheduledAction} from "../types/output/ScheduledAction";

// Dataclasses
let house: Dataclass;
let wall: Dataclass;
let cable: Dataclass;

// Instances
let mapleStreet: Instance;
let bakerStreet: Instance;
let wallStreet: Instance;
let bakerStreetWall: Instance;
let wallStreetWall: Instance;

// ExecutionDataObjectInstances
let mapleStreetInit: StateInstance;
let mapleStreetPainted: StateInstance;
let mapleStreetTiled: StateInstance;

let bakerStreetInit: StateInstance;
let bakerStreetPainted: StateInstance;
let bakerStreetPlastered: StateInstance;

let wallStreetInit: StateInstance;
let wallStreetPlastered: StateInstance;

let bakerStreetWallAvailable: StateInstance;
let bakerStreetWallStanding: StateInstance;

let wallStreetWallAvailable: StateInstance;
let wallStreetWallStanding: StateInstance

// Roles
let painter: Role;
let tiler: Role;
let electrician: Role;
let builder: Role;

// Resources
let picasso: Resource;
let michelangelo: Resource;
let tesla: Resource;
let bob: Resource;

// DataObjectReferences
let houseInit: DataObjectReference;
let housePainted: DataObjectReference;
let housePlastered: DataObjectReference;
let houseTiled: DataObjectReference;
let cableAvailable: DataObjectReference;
let wallAvailable: DataObjectReference;
let wallStanding: DataObjectReference;

// IOSets
let inputSetPaint: IOSet;
let outputSetPaint: IOSet;

let inputSetPlaster: IOSet;
let outputSetPlaster: IOSet;

let inputSetPutWalls: IOSet;
let outputSetPutWalls: IOSet;

let inputSetTile: IOSet;
let outputSetTile: IOSet;

// Activities
let paint: Activity;
let plaster: Activity;
let putWalls: Activity;
let tile: Activity;

// ObjectiveObjects
let objectiveObject: ObjectiveObject;
let objectiveObject2: ObjectiveObject;
let objectiveObject3: ObjectiveObject;

// Objectives
let objective: Objective;
let objective2: Objective;

// Goal
let goal: Goal;

// Project State
let resources: Resource[];
let currentState: ExecutionState;


beforeEach(() => {
    //reset all dataclasses
    house = new Dataclass("1", "house");
    wall = new Dataclass("2", "wall");
    cable = new Dataclass("3", "cable");

    //reset all instances
    mapleStreet = new Instance("house_1", "1", house);
    bakerStreet = new Instance("house_2", "2", house);
    wallStreet = new Instance("house_3", "3", house);
    bakerStreetWall = new Instance("wall_1", "1", wall);
    wallStreetWall = new Instance("wall_2", "2", wall);

    //reset all stateInstance
    mapleStreetInit = new StateInstance(mapleStreet, "init");
    mapleStreetPainted = new StateInstance(mapleStreet, "painted");
    mapleStreetTiled = new StateInstance(mapleStreet, "tiled");

    bakerStreetInit = new StateInstance(bakerStreet, "init");
    bakerStreetPainted = new StateInstance(bakerStreet, "painted");
    bakerStreetPlastered = new StateInstance(bakerStreet, "plastered");

    wallStreetInit = new StateInstance(wallStreet, "init");
    wallStreetPlastered = new StateInstance(wallStreet, "plastered");

    bakerStreetWallAvailable = new StateInstance(bakerStreetWall, "available");
    bakerStreetWallStanding = new StateInstance(bakerStreetWall, "standing");
    wallStreetWallAvailable = new StateInstance(wallStreetWall, "available");
    wallStreetWallStanding = new StateInstance(wallStreetWall, "standing");

    //reset all roles
    painter = new Role("1", "painter");
    tiler = new Role("2", "tiler");
    electrician = new Role("3", "electrician");
    builder = new Role("4", "builder");

    //reset all resources
    picasso = new Resource("1", "Picasso", [painter], 1);
    michelangelo = new Resource("2", "Michelangelo", [tiler], 1);
    tesla = new Resource("3", "Tesla", [electrician], 1);
    bob = new Resource("4", "Bob", [builder], 1);

    //reset all dataObjectReferences
    houseInit = new DataObjectReference(house, "init", false);
    housePainted = new DataObjectReference(house, "painted", false);
    housePlastered = new DataObjectReference(house, "plastered", false);
    houseTiled = new DataObjectReference(house, "tiled", false);
    cableAvailable = new DataObjectReference(cable, "available", false);
    wallAvailable = new DataObjectReference(wall, "available", true);
    wallStanding = new DataObjectReference(wall, "standing", true);

    //reset all IOSets
    inputSetPaint = new IOSet([houseInit]);
    outputSetPaint = new IOSet([housePainted]);

    inputSetPlaster = new IOSet([wallStanding]);
    outputSetPlaster = new IOSet([housePlastered]);

    inputSetPutWalls = new IOSet([wallAvailable]);
    outputSetPutWalls = new IOSet([wallStanding]);

    inputSetTile = new IOSet([housePainted]);
    outputSetTile = new IOSet([houseTiled]);

    //reset ObjectiveObjects
    objectiveObject = new ObjectiveObject("house_1", mapleStreet, ["painted"]);
    objectiveObject2 = new ObjectiveObject("house_2", mapleStreet, ["tiled"]);
    objectiveObject3 = new ObjectiveObject("house_3", bakerStreet, ["painted"]);

    //reset objectives
    objective = new Objective("1", [objectiveObject], []);

    //reset goal
    goal = new Goal([objective]);

    //reset all activities
    paint = new Activity("paint", 1, 1, painter, inputSetPaint, outputSetPaint);
    plaster = new Activity("plaster", 1, 1, painter, inputSetPlaster, outputSetPlaster);
    putWalls = new Activity("put Walls", 1, 1, builder, inputSetPutWalls, outputSetPutWalls);
    tile = new Activity("tile", 1, 1, tiler, inputSetTile, outputSetTile);

    //reset all project states
    resources = [michelangelo, bob, picasso];
    currentState = new ExecutionState([mapleStreetInit], [], [], resources,
        0, [], [], []);
});

describe('generate plan', () => {

    test('plan one activity', () => {
        let outputAction = new ScheduledAction(paint, 0, 1, picasso, 1, [mapleStreetInit],
            [mapleStreetPainted]);
        let executionLog = new Schedule([outputAction], [mapleStreet], resources);

        let planner = new Planner(currentState, goal, [paint]);

        expect(planner.generatePlan()).toEqual(executionLog);
    });

    test('plan two activities', () => {
        let resources = [picasso, michelangelo];
        let outputAction = new ScheduledAction(paint, 0, 1, picasso, 1, [mapleStreetInit],
            [mapleStreetPainted]);
        let outputAction2 = new ScheduledAction(tile, 1, 2, michelangelo, 1, [mapleStreetPainted],
            [mapleStreetTiled]);
        let executionLog = new Schedule([outputAction, outputAction2], [mapleStreet], resources);

        objective2 = new Objective("2", [objectiveObject2], []);
        goal = new Goal([objective, objective2]);

        currentState.resources = resources;
        let planner = new Planner(currentState, goal, [paint, tile]);
        expect(planner.generatePlan()).toEqual(executionLog);
    });

    test('plan one activity on two objects', () => {
        let outputAction = new ScheduledAction(paint, 0, 1, picasso, 1, [mapleStreetInit],
            [mapleStreetPainted]);
        let outputAction2 = new ScheduledAction(paint, 1, 2, picasso, 1, [bakerStreetInit],
            [bakerStreetPainted]);
        let executionLog = new Schedule([outputAction, outputAction2], [bakerStreet, mapleStreet],
            resources);

        objective = new Objective("1", [objectiveObject, objectiveObject3], []);
        goal = new Goal([objective]);

        currentState.availableStateInstances = [mapleStreetInit, bakerStreetInit];
        let planner = new Planner(currentState, goal, [paint, tile]);
        expect(planner.generatePlan()).toEqual(executionLog);
    });

    test('plan activities which create new instances', () => {
        let outputAction1 = new ScheduledAction(paint, 0, 1, picasso, 1, [mapleStreetInit],
            [mapleStreetPainted]);
        let outputAction2 = new ScheduledAction(putWalls, 0, 1, bob, 1, [bakerStreetWallAvailable],
            [bakerStreetWallStanding]);
        let outputAction3 = new ScheduledAction(plaster, 1, 2, picasso, 1, [bakerStreetWallStanding],
            [bakerStreetPlastered]);
        let outputAction4 = new ScheduledAction(tile, 1, 2, michelangelo, 1, [mapleStreetPainted],
            [mapleStreetTiled]);
        let outputAction5 = new ScheduledAction(plaster, 2, 3, picasso, 1, [bakerStreetWallStanding],
            [wallStreetPlastered]);
        let executionLog = new Schedule(
            [outputAction1, outputAction2, outputAction3, outputAction4, outputAction5],
            [wallStreet, mapleStreet, bakerStreet, bakerStreetWall, wallStreetWall],
            [bob, michelangelo, picasso]);

        let house1tiled = new ObjectiveObject("4", mapleStreet, ["tiled"]);
        let house3plastered = new ObjectiveObject("5", wallStreet, ["plastered"]);

        objective = new Objective("1", [house1tiled, house3plastered], []);
        goal = new Goal([objective]);

        currentState.availableStateInstances = [mapleStreetInit, bakerStreetWallAvailable, wallStreetWallAvailable];
        let planner = new Planner(currentState, goal, [paint, plaster, putWalls, tile]);
        expect(planner.generatePlan()).toEqual(executionLog);
    });
});