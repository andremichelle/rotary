import { Editor } from "./inputs.js";
import { CShapeInjective, Injective, InjectiveType, PowInjective, SmoothStepInjective, TShapeInjective } from "../lib/injective.js";
import { ObservableValue } from "../lib/common.js";
export declare const InjectiveTypes: Map<string, InjectiveType>;
export declare class InjectiveEditor implements Editor<ObservableValue<Injective<any>>> {
    private readonly element;
    private readonly name;
    private readonly terminator;
    private readonly typeValue;
    private readonly typeSelectInput;
    private readonly powInjectiveEditor;
    private readonly cShapeInjectiveEditor;
    private readonly tShapeInjectiveEditor;
    private readonly smoothStepInjectiveEditor;
    private editable;
    private subscription;
    constructor(element: Element, name: string);
    with(value: ObservableValue<Injective<any>>): void;
    clear(): void;
    terminate(): void;
    private updateType;
}
export declare class PowInjectiveEditor implements Editor<PowInjective> {
    private readonly input;
    constructor(element: Element, group: string);
    with(value: PowInjective): void;
    clear(): void;
    terminate(): void;
}
export declare class CShapeInjectiveEditor implements Editor<CShapeInjective> {
    private readonly input;
    constructor(element: Element, name: string);
    with(value: CShapeInjective): void;
    clear(): void;
    terminate(): void;
}
export declare class TShapeInjectiveEditor implements Editor<TShapeInjective> {
    private readonly input;
    constructor(element: Element, name: string);
    with(value: TShapeInjective): void;
    clear(): void;
    terminate(): void;
}
export declare class SmoothStepInjectiveEditor implements Editor<SmoothStepInjective> {
    private readonly input0;
    private readonly input1;
    constructor(element: Element, name: string);
    with(value: SmoothStepInjective): void;
    clear(): void;
    terminate(): void;
}
