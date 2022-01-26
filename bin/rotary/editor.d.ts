import { Option, Terminable } from "../lib/common.js";
import { RotaryTrackModel } from "./model.js";
export interface RotaryTrackEditorExecutor {
    deleteTrack(): void;
}
export declare class RotaryTrackEditor implements Terminable {
    private readonly executor;
    private readonly terminator;
    private readonly segments;
    private readonly width;
    private readonly widthPadding;
    private readonly length;
    private readonly lengthRatio;
    private readonly outline;
    private readonly fill;
    private readonly motion;
    private readonly rgb;
    private readonly phaseOffset;
    private readonly bend;
    private readonly frequency;
    private readonly fragments;
    private readonly reverse;
    subject: Option<RotaryTrackModel>;
    constructor(executor: RotaryTrackEditorExecutor, parentNode: ParentNode);
    edit(model: RotaryTrackModel): void;
    clear(): void;
    terminate(): void;
}
