import { RotaryModel } from "./model/rotary.js";
import { RotaryTrackModel } from "./model/track.js";
export interface RenderConfiguration {
    fps: number;
    subFrames: number;
    numFrames: number;
    size: number;
}
export declare class RotaryRenderer {
    static render(context: CanvasRenderingContext2D, model: RotaryModel, phase: number, alphaMultiplier?: number): void;
    static renderTrackPreview(context: CanvasRenderingContext2D, trackModel: RotaryTrackModel, size: number): void;
    private static renderTrack;
    private static renderSection;
    static renderFrames(model: RotaryModel, configuration: RenderConfiguration, process: (context: CanvasRenderingContext2D) => void, progress?: (progress: number) => void): Promise<void>;
    static renderFrame(model: RotaryModel, configuration: RenderConfiguration): Generator<CanvasRenderingContext2D>;
}
