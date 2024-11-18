import {Role} from "./Role";

export class Resource {
    id: string;
    name: string;
    roles: Role[];
    capacity: number;
    availabilityStart: number;
    availabilityEnd: number;

    public constructor(id: string, name: string, roles: Role[] = [], capacity: number, availabilityStart: number = 0, availabilityEnd: number = Infinity) {
        this.id = id;
        this.name = name;
        this.roles = roles;
        this.capacity = capacity;
        this.availabilityStart = availabilityStart;
        this.availabilityEnd = availabilityEnd;
    }

    public satisfies(role: Role, NoP: number, time: number, duration: number): boolean {
        return this.roles.includes(role) && NoP <= this.capacity && time >= this.availabilityStart && time + duration - 1 <= this.availabilityEnd;
    }
}