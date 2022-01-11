import { RotaryModel, RotaryTrackModel } from "./model.js";
export declare class RotaryRenderer {
    private readonly context;
    private readonly model;
    static renderTrack(context: CanvasRenderingContext2D, model: RotaryTrackModel, radiusMin: number, position: number): void;
    static renderSection(context: CanvasRenderingContext2D, model: RotaryTrackModel, radiusMin: number, radiusMax: number, angleMin: number, angleMax: number): void;
    private highlight;
    constructor(context: CanvasRenderingContext2D, model: RotaryModel);
    draw(position: number): void;
    showHighlight(model: RotaryTrackModel): void;
    releaseHighlight(): void;
}
