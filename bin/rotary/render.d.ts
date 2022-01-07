import { Fill, RotaryModel, RotaryTrackModel } from "./model.js";
export declare class RotaryRenderer {
    private readonly context;
    private readonly rotary;
    private highlight;
    constructor(context: CanvasRenderingContext2D, rotary: RotaryModel);
    draw(position: number): void;
    drawTrack(model: RotaryTrackModel, radiusMin: number, position: number): void;
    drawSection(model: RotaryTrackModel, radiusMin: number, radiusMax: number, angleMin: number, angleMax: number, fill: Fill): void;
    showHighlight(model: RotaryTrackModel): void;
    releaseHighlight(): void;
}
