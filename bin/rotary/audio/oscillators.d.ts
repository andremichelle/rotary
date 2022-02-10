import { Voice } from "./voices.js";
import { RotaryTrackModel } from "../model.js";
export declare class OscillatorVoice extends Voice {
    private static ENVELOPE_TIME;
    private static ENVELOPE_TIME_INV;
    private position;
    private duration;
    private readonly frequency;
    constructor(startFrame: number, trackIndex: number, segmentIndex: number, track: RotaryTrackModel);
    process(outputs: Float32Array[][], positions: Float32Array): boolean;
    stop(): void;
}
