export declare enum Shape {
    Sine = 0,
    Triangle = 1,
    SawtoothUp = 2,
    SawtoothDown = 3,
    Random = 4
}
export declare type Message = SetShape | SetFrequency;
export declare class SetShape {
    readonly shape: Shape;
    readonly type = "shape";
    constructor(shape: Shape);
}
export declare class SetFrequency {
    readonly hz: number;
    readonly type = "frequency";
    constructor(hz: number);
}
