import { RotaryModel } from "./model.js";
import { ObservableValue, Terminable } from "../lib/common.js";
export interface AudioSceneController extends Terminable {
    transport: ObservableValue<boolean>;
    phase(): number;
    rewind(): void;
}
export interface AudioScene {
    build(context: BaseAudioContext, output: AudioNode, model: RotaryModel, onProgressInfo: (info: string) => void): Promise<AudioSceneController>;
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
    render(passes?: number): Promise<AudioBuffer>;
}
