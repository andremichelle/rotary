import { Shape } from "./messages.js";
export declare class LfoWorklet extends AudioWorkletNode {
    private $shape;
    private $frequency;
    constructor(context: any);
    shape: Shape;
    frequency: number;
}
