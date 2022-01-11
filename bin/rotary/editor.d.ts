import { ObservableValue, Option, Terminable } from "../lib/common.js";
import { Editor } from "../dom/inputs.js";
import { RotaryTrackModel } from "./model.js";
import { CShapeMotion, Motion, PowMotion, SmoothStepMotion, TShapeMotion } from "./motion.js";
export interface RotaryTrackEditorExecutor {
    deleteTrack(): void;
}
export declare class PowMotionEditor implements Editor<PowMotion> {
    private readonly input;
    constructor(element: Element);
    with(value: PowMotion): void;
    clear(): void;
    terminate(): void;
}
export declare class CShapeMotionEditor implements Editor<CShapeMotion> {
    private readonly input;
    constructor(element: Element);
    with(value: CShapeMotion): void;
    clear(): void;
    terminate(): void;
}
export declare class TShapeMotionEditor implements Editor<TShapeMotion> {
    private readonly input;
    constructor(element: Element);
    with(value: TShapeMotion): void;
    clear(): void;
    terminate(): void;
}
export declare class SmoothStepMotionEditor implements Editor<SmoothStepMotion> {
    private readonly input0;
    private readonly input1;
    constructor(element: Element);
    with(value: SmoothStepMotion): void;
    clear(): void;
    terminate(): void;
}
export declare class MotionEditor implements Editor<ObservableValue<Motion<any>>> {
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
    with(value: ObservableValue<Motion<any>>): void;
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
    private readonly fill;
    private readonly motion;
    private readonly rgb;
    private readonly phaseOffset;
    private readonly frequency;
    private readonly reverse;
    subject: Option<RotaryTrackModel>;
    constructor(executor: RotaryTrackEditorExecutor, parentNode: ParentNode);
    edit(model: RotaryTrackModel): void;
    clear(): void;
    terminate(): void;
}
