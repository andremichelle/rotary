import { RotaryModel, RotaryTrackModel } from "./model.js";
export declare class RotaryRenderer {
    static render(context: CanvasRenderingContext2D, model: RotaryModel, position: number): void;
    static renderTrack(context: CanvasRenderingContext2D, model: RotaryTrackModel, radiusMin: number, position: number): void;
    static renderSection(context: CanvasRenderingContext2D, model: RotaryTrackModel, radiusMin: number, radiusMax: number, angleMin: number, angleMax: number): void;
    static renderFrames(model: RotaryModel, numFrames: number, size: number, process: (context: CanvasRenderingContext2D) => void, progress?: (progress: number) => void): Promise<void>;
    static renderFrame(model: RotaryModel, numFrames: number, size: number): Generator<CanvasRenderingContext2D>;
}
