import { Voice } from "./voices.js";
import { RotaryTrackModel } from "../model.js";
export declare class Sample {
    readonly frames: Float32Array[];
    readonly numFrames: number;
    readonly loop: boolean;
    constructor(frames: Float32Array[], numFrames: number, loop: boolean);
}
export declare class SampleRepository {
    private readonly map;
    private maxKey;
    constructor();
    set(key: number, sample: Sample): void;
    get(key: number): Sample;
    modulo(index: number): number;
}
export declare class SampleVoice extends Voice {
    private readonly sample;
    private position;
    private static ATTACK;
    private static RELEASE;
    private duration;
    constructor(startFrame: number, trackIndex: number, segmentIndex: number, track: RotaryTrackModel, sample: Sample, position?: number);
    process(outputs: Float32Array[][], positions: Float32Array): boolean;
    stop(): void;
}
