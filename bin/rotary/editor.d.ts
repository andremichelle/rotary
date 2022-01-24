import { ObservableValue, Option, Terminable } from "../lib/common.js";
import { Editor } from "../dom/inputs.js";
import { RotaryTrackModel } from "./model.js";
import { CShapeInjective, Injective, PowInjective, SmoothStepInjective, TShapeInjective } from "./injective.js";
export interface RotaryTrackEditorExecutor {
    deleteTrack(): void;
}
export declare class PowMotionEditor implements Editor<PowInjective> {
    private readonly input;
    constructor(element: Element);
    with(value: PowInjective): void;
    clear(): void;
    terminate(): void;
}
export declare class CShapeMotionEditor implements Editor<CShapeInjective> {
    private readonly input;
    constructor(element: Element);
    with(value: CShapeInjective): void;
    clear(): void;
    terminate(): void;
}
export declare class TShapeMotionEditor implements Editor<TShapeInjective> {
    private readonly input;
    constructor(element: Element);
    with(value: TShapeInjective): void;
    clear(): void;
    terminate(): void;
}
export declare class SmoothStepMotionEditor implements Editor<SmoothStepInjective> {
    private readonly input0;
    private readonly input1;
    constructor(element: Element);
    with(value: SmoothStepInjective): void;
    clear(): void;
    terminate(): void;
}
export declare class MotionEditor implements Editor<ObservableValue<Injective<any>>> {
    private readonly editor;
    private readonly element;
    private readonly terminator;
    private readonly motionTypeValue;
    private readonly typeSelectInput;
    private readonly powMotionEditor;
    private readonly cShapeMotionEditor;
    private readonly tShapeMotionEditor;
    private readonly smoothStepMotionEditor;
    private editable;
    private subscription;
    constructor(editor: RotaryTrackEditor, element: Element);
    with(value: ObservableValue<Injective<any>>): void;
    clear(): void;
    terminate(): void;
    private updateMotionType;
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
