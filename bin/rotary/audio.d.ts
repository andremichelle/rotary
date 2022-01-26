import { RotaryModel } from "./model.js";
import { Terminable } from "../lib/common";
export interface AudioBuilder {
    build(context: BaseAudioContext, output: AudioNode, model: RotaryModel, onProgressInfo: (info: string) => void): Promise<Terminable>;
}
export declare class Audio {
    readonly context: AudioContext;
    readonly builder: AudioBuilder;
    readonly model: RotaryModel;
    static create(builder: AudioBuilder, model: RotaryModel): Promise<Audio>;
    static RENDER_SAMPLE_RATE: number;
    private constructor();
    readonly currentTime: number;
    readonly totalTime: number;
    readonly totalFrames: number;
    render(passes?: number): Promise<AudioBuffer>;
}
