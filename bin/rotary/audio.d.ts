import { RotaryModel } from "./model.js";
import { NoUIMeterWorklet } from "../audio/meter/worklet.js";
import { Boot, ObservableValue, Terminable } from "../lib/common.js";
import { Transport } from "../audio/sequencing.js";
export interface AudioSceneController extends Terminable {
    phase(): number;
    latency(): number;
    metronome: ObservableValue<boolean>;
    transport: Transport;
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
