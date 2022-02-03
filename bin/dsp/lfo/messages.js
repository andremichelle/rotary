export var Shape;
(function (Shape) {
    Shape[Shape["Sine"] = 0] = "Sine";
    Shape[Shape["Triangle"] = 1] = "Triangle";
    Shape[Shape["SawtoothUp"] = 2] = "SawtoothUp";
    Shape[Shape["SawtoothDown"] = 3] = "SawtoothDown";
    Shape[Shape["Random"] = 4] = "Random";
})(Shape || (Shape = {}));
export class SetShape {
    constructor(shape) {
        this.shape = shape;
        this.type = 'shape';
    }
}
export class SetFrequency {
    constructor(hz) {
        this.hz = hz;
        this.type = 'frequency';
    }
}
//# sourceMappingURL=messages.js.map