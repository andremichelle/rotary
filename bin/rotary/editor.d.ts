import { NoArgType, Option, Terminable } from "../lib/common.js";
import { RotaryTrackModel } from "./model.js";
import { ControlBuilder, UIControllerLayout } from "../dom/controls.js";
import { Injective, InjectiveType } from "../lib/injective.js";
export declare const InjectiveTypes: Map<string, InjectiveType>;
export declare class InjectiveControlBuilder implements ControlBuilder<Injective<any>> {
    static instance: InjectiveControlBuilder;
    build(layout: UIControllerLayout, value: Injective<any>): void;
    availableTypes(): Map<string, NoArgType<Injective<any>>>;
}
export interface RotaryTrackEditorExecutor {
    deleteTrack(trackModel: RotaryTrackModel): void;
    moveTrackLeft(trackModel: RotaryTrackModel): void;
    moveTrackRight(trackModel: RotaryTrackModel): void;
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
    private readonly volume;
    private readonly panning;
    private readonly auxSends;
    subject: Option<RotaryTrackModel>;
    constructor(executor: RotaryTrackEditorExecutor, parentNode: HTMLElement);
    edit(model: RotaryTrackModel): void;
    clear(): void;
    terminate(): void;
}
