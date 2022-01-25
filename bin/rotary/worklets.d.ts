import { RotaryModel } from "./model.js";
export declare const handleErrors: (worklet: AudioWorkletNode) => void;
export declare class RotaryAutomationNode extends AudioWorkletNode {
    static build(context: AudioContext): Promise<RotaryAutomationNode>;
    constructor(context: AudioContext);
    updateFormat(model: RotaryModel): void;
}
export declare class RotarySineNode extends AudioWorkletNode {
    static build(context: AudioContext): Promise<RotarySineNode>;
    constructor(context: AudioContext);
}
export declare class RotaryPlaybackNode extends AudioWorkletNode {
    static build(context: AudioContext): Promise<RotaryPlaybackNode>;
    constructor(context: AudioContext);
    updateFormat(model: RotaryModel): void;
    updateSample(key: number, sample: AudioBuffer | Float32Array | Float32Array[], loop?: boolean): void;
}
