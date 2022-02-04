import { RotaryModel } from "./model.js";
import { NoUIMeterWorklet } from "../dsp/meter/worklet.js";
import { Boot, ObservableValue, Terminable } from "../lib/common.js";
export interface AudioSceneController extends Terminable {
    transport: ObservableValue<boolean>;
    rewind(): void;
    phase(): number;
    latency(): number;
    meter: NoUIMeterWorklet;
}
export interface AudioScene {
    loadModules(context: BaseAudioContext): Promise<void>;
    build(context: BaseAudioContext, output: AudioNode, model: RotaryModel, boot: Boot): Promise<AudioSceneController>;
}
export declare class Audio {
    readonly context: AudioContext;
    readonly scene: AudioScene;
    readonly model: RotaryModel;
    static config(scene: AudioScene, model: RotaryModel): Promise<Audio>;
    static RENDER_SAMPLE_RATE: number;
    private constructor();
    initPreview(): Promise<AudioSceneController>;
    readonly currentTime: number;
    readonly totalTime: number;
    readonly totalFrames: number;
    exportWav(passes?: number): Promise<void>;
    render(passes: number): Promise<Float32Array[]>;
}
