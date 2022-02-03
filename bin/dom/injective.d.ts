import { Editor } from "./inputs.js";
import { Injective, InjectiveType } from "../lib/injective.js";
import { ObservableValue } from "../lib/common.js";
export declare const InjectiveTypes: Map<string, InjectiveType>;
export declare class InjectiveEditor implements Editor<ObservableValue<Injective<any>>> {
    private readonly parentElement;
    private readonly selectLayout;
    private readonly controllerLayout;
    private readonly terminator;
    private readonly typeValue;
    private readonly typeSelectInput;
    private editable;
    private subscription;
    constructor(parentElement: HTMLElement, name: string);
    with(value: ObservableValue<Injective<any>>): void;
    clear(): void;
    terminate(): void;
    private updateType;
}
