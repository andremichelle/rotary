export declare enum Shape {
    Sine = 0,
    Triangle = 1,
    SawtoothUp = 2,
    SawtoothDown = 3,
    Random = 4
}
export declare type Message = {
    type: "set-shape";
    shape: Shape;
} | {
    type: "set-frequency";
    hz: number;
};
