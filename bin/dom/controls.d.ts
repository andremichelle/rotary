import { Checkbox, NumericInput, NumericStepperInput, SelectInput } from "./inputs.js";
import { NumericStepper, PrintMapping, Terminable } from "../lib/common.js";
export declare class UIControllerLayout implements Terminable {
    private readonly container?;
    private readonly terminator;
    constructor(container?: HTMLElement);
    element(): HTMLElement;
    createNumericStepper(labelText: string, printMapping: PrintMapping<number>, stepper: NumericStepper): NumericStepperInput;
    createNumericInput(labelText: string, printMapping: PrintMapping<number>): NumericInput;
    createSelect<T>(labelText: string, map: Map<string, T>): SelectInput<T>;
    createCheckbox(labelText: string): Checkbox;
    terminate(): void;
    private append;
    private static createLabel;
}
