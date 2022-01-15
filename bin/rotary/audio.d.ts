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
export declare class RotarySampleNode extends AudioWorkletNode {
    static build(context: AudioContext): Promise<RotarySampleNode>;
    constructor(context: AudioContext);
    updateNumberOfTracks(numTracks: number): void;
    updateSample(buffer: AudioBuffer): void;
}
export declare class MappingNode extends AudioWorkletNode {
    static load(context: AudioContext): Promise<void>;
    constructor(context: AudioContext);
}
