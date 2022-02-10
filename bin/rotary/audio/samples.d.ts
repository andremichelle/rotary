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
export declare class SampleVoice implements Voice {
    private startFrameIndex;
    private readonly outputIndex;
    private readonly track;
    private readonly sample;
    private position;
    static ATTACK: number;
    static RELEASE: number;
    duration: number;
    constructor(startFrameIndex: number, outputIndex: number, track: RotaryTrackModel, sample: Sample, position?: number);
    process(outputs: Float32Array[][]): boolean;
    stop(): void;
}
