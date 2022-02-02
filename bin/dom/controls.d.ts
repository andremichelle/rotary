import { NumericInput, NumericStepperInput, SelectInput } from "./inputs.js";
import { NumericStepper, PrintMapping } from "../lib/common.js";
export declare class TwoColumnBuilder {
    private readonly container;
    constructor();
    element(): HTMLElement;
    createStepper(labelText: string, printMapping: PrintMapping<number>, stepper: NumericStepper): NumericStepperInput;
    createNumericInput(labelText: string, printMapping: PrintMapping<number>): NumericInput;
    createSelect<T>(labelText: string, map: Map<string, T>): SelectInput<T>;
}
