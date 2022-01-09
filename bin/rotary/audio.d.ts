import { RotaryModel } from "./model.js";
export declare class RotaryWorkletNode extends AudioWorkletNode {
    static build(context: AudioContext): Promise<RotaryWorkletNode>;
    constructor(context: AudioContext);
    updateLoopDuration(seconds: number): void;
    updateFormat(model: RotaryModel): void;
}
