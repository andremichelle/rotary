import { RotaryModel } from "./model.js";
export declare class RotaryAutomationNode extends AudioWorkletNode {
    static build(context: AudioContext): Promise<RotaryAutomationNode>;
    constructor(context: AudioContext);
    updateLoopDuration(seconds: number): void;
    updateFormat(model: RotaryModel): void;
}
export declare class RotarySineNode extends AudioWorkletNode {
    static build(context: AudioContext): Promise<RotarySineNode>;
    constructor(context: AudioContext);
}
