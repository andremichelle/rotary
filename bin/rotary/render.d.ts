import { RotaryModel, RotaryTrackModel } from "./model.js";
export declare class RotaryRenderer {
    static render(context: CanvasRenderingContext2D, model: RotaryModel, phase: number): void;
    static renderTrackPreview(context: CanvasRenderingContext2D, trackModel: RotaryTrackModel, size: number): void;
    private static renderTrack;
    private static renderSection;
    static renderFrames(model: RotaryModel, numFrames: number, size: number, process: (context: CanvasRenderingContext2D) => void, progress?: (progress: number) => void): Promise<void>;
    static renderFrame(model: RotaryModel, numFrames: number, size: number): Generator<CanvasRenderingContext2D>;
}
