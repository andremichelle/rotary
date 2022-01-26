import { RotaryModel } from "./model.js";
export declare const handleErrors: (worklet: AudioWorkletNode) => void;
export declare class RotaryAutomationNode extends AudioWorkletNode {
    static build(context: BaseAudioContext): Promise<RotaryAutomationNode>;
    constructor(context: BaseAudioContext);
    updateFormat(model: RotaryModel): void;
}
export declare class RotarySineNode extends AudioWorkletNode {
    static build(context: BaseAudioContext): Promise<RotarySineNode>;
    constructor(context: BaseAudioContext);
}
export declare class RotaryPlaybackNode extends AudioWorkletNode {
    static build(context: BaseAudioContext): Promise<RotaryPlaybackNode>;
    constructor(context: BaseAudioContext);
    updateFormat(model: RotaryModel): void;
    updateSample(key: number, sample: AudioBuffer | Float32Array | Float32Array[], loop?: boolean): void;
}
