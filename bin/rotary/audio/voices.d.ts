import { RotaryTrackModel } from "../model/track.js";
export declare abstract class Voice {
    protected startFrame: number;
    protected readonly trackIndex: number;
    protected readonly segmentIndex: number;
    protected readonly track: RotaryTrackModel;
    protected constructor(startFrame: number, trackIndex: number, segmentIndex: number, track: RotaryTrackModel);
    abstract process(outputs: Float32Array[][], positions: Float32Array): boolean;
    abstract stop(): any;
}
export declare class VoiceManager {
    private readonly voices;
    constructor();
    add(index: number, voice: Voice): void;
    stopAll(): void;
    stopByIndex(index: number): void;
    process(outputs: Float32Array[][], positions: Float32Array): void;
}
