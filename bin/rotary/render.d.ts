import { RotaryModel } from "./model/rotary.js";
import { RotaryTrackModel } from "./model/track.js";
export interface RenderConfiguration {
    fps: number;
    size: number;
    numFrames: number;
    motionFrames: number;
    alpha: boolean;
    background: string;
}
export declare const createRenderConfiguration: (options: Partial<RenderConfiguration>) => RenderConfiguration;
export declare class RotaryRenderer {
    static render(context: CanvasRenderingContext2D, model: RotaryModel, phase: number, alphaMultiplier?: number): void;
    static renderTrackPreview(context: CanvasRenderingContext2D, trackModel: RotaryTrackModel, size: number): void;
    private static renderTrack;
    private static renderSection;
    static renderFrames(model: RotaryModel, configuration: RenderConfiguration, process: (context: CanvasRenderingContext2D) => void, progress?: (progress: number) => void): Promise<void>;
    static iterateFrames(model: RotaryModel, configuration: RenderConfiguration): Generator<CanvasRenderingContext2D>;
    static renderFrame(context: CanvasRenderingContext2D, model: RotaryModel, size: number, motionFrames: number, fps: number, phase: number, padding?: number, background?: string): void;
}
