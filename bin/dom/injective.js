import { NumericStepperInput, SelectInput } from "./inputs.js";
import { CShapeInjective, IdentityInjective, PowInjective, SmoothStepInjective, TShapeInjective } from "../lib/injective.js";
import { NumericStepper, ObservableValueImpl, ObservableValueVoid, Options, PrintMapping, Terminator } from "../lib/common.js";
export const InjectiveTypes = new Map([
    ["Linear", IdentityInjective],
    ["Power", PowInjective],
    ["CShape", CShapeInjective],
    ["TShape", TShapeInjective],
    ["SmoothStep", SmoothStepInjective]
]);
export class InjectiveEditor {
    constructor(element, name) {
        this.element = element;
        this.name = name;
        this.terminator = new Terminator();
        this.typeValue = this.terminator.with(new ObservableValueImpl(InjectiveTypes[0]));
        this.editable = Options.None;
        this.subscription = Options.None;
        this.typeSelectInput = this.terminator.with(new SelectInput(element
            .querySelector(`select[data-parameter=${name}]`), InjectiveTypes));
        this.typeSelectInput.with(this.typeValue);
        this.powInjectiveEditor = this.terminator.with(new PowInjectiveEditor(element, name));
        this.cShapeInjectiveEditor = this.terminator.with(new CShapeInjectiveEditor(element, name));
        this.tShapeInjectiveEditor = this.terminator.with(new TShapeInjectiveEditor(element, name));
        this.smoothStepInjectiveEditor = this.terminator.with(new SmoothStepInjectiveEditor(element, name));
        this.terminator.with(this.typeValue.addObserver(type => this.editable.ifPresent(value => value.set(new type()))));
    }
    with(value) {
        this.subscription.ifPresent(_ => _.terminate());
        this.editable = Options.None;
        this.subscription = Options.valueOf(value.addObserver(value => this.updateType(value)));
        this.updateType(value.get());
        this.editable = Options.valueOf(value);
    }
    clear() {
        this.subscription.ifPresent(_ => _.terminate());
        this.subscription = Options.None;
        this.editable = Options.None;
        this.element.removeAttribute(`data-${this.name}`);
        this.powInjectiveEditor.clear();
        this.cShapeInjectiveEditor.clear();
        this.smoothStepInjectiveEditor.clear();
    }
    terminate() {
        this.terminator.terminate();
    }
    updateType(injective) {
        const type = injective.constructor;
        this.typeValue.set(type);
        if (injective instanceof IdentityInjective) {
            this.element.setAttribute(`data-${this.name}`, "linear");
            this.powInjectiveEditor.clear();
            this.cShapeInjectiveEditor.clear();
            this.tShapeInjectiveEditor.clear();
            this.smoothStepInjectiveEditor.clear();
        }
        else if (injective instanceof PowInjective) {
            this.element.setAttribute(`data-${this.name}`, "pow");
            this.powInjectiveEditor.with(injective);
            this.cShapeInjectiveEditor.clear();
            this.tShapeInjectiveEditor.clear();
            this.smoothStepInjectiveEditor.clear();
        }
        else if (injective instanceof CShapeInjective) {
            this.element.setAttribute(`data-${this.name}`, "cshape");
            this.powInjectiveEditor.clear();
            this.cShapeInjectiveEditor.with(injective);
            this.tShapeInjectiveEditor.clear();
            this.smoothStepInjectiveEditor.clear();
        }
        else if (injective instanceof TShapeInjective) {
            this.element.setAttribute(`data-${this.name}`, "tshape");
            this.powInjectiveEditor.clear();
            this.tShapeInjectiveEditor.with(injective);
            this.cShapeInjectiveEditor.clear();
            this.smoothStepInjectiveEditor.clear();
        }
        else if (injective instanceof SmoothStepInjective) {
            this.element.setAttribute(`data-${this.name}`, "smoothstep");
            this.powInjectiveEditor.clear();
            this.tShapeInjectiveEditor.clear();
            this.cShapeInjectiveEditor.clear();
            this.smoothStepInjectiveEditor.with(injective);
        }
    }
}
export class PowInjectiveEditor {
    constructor(element, group) {
        this.input = new NumericStepperInput(element.querySelector(`fieldset[data-group='${group}'][data-injective='pow'][data-parameter='exponent']`), PrintMapping.float(2, "x^", ""), NumericStepper.Hundredth);
    }
    with(value) {
        this.input.with(value.exponent);
    }
    clear() {
        this.input.with(ObservableValueVoid.Instance);
    }
    terminate() {
        this.input.terminate();
    }
}
export class CShapeInjectiveEditor {
    constructor(element, name) {
        this.input = new NumericStepperInput(element.querySelector(`fieldset[data-group='${name}'][data-injective='cshape'][data-parameter='shape']`), PrintMapping.float(2, "", ""), NumericStepper.Hundredth);
    }
    with(value) {
        this.input.with(value.slope);
    }
    clear() {
        this.input.with(ObservableValueVoid.Instance);
    }
    terminate() {
        this.input.terminate();
    }
}
export class TShapeInjectiveEditor {
    constructor(element, name) {
        this.input = new NumericStepperInput(element.querySelector(`fieldset[data-group='${name}'][data-injective='tshape'][data-parameter='shape']`), PrintMapping.UnipolarPercent, NumericStepper.Hundredth);
    }
    with(value) {
        this.input.with(value.shape);
    }
    clear() {
        this.input.with(ObservableValueVoid.Instance);
    }
    terminate() {
        this.input.terminate();
    }
}
export class SmoothStepInjectiveEditor {
    constructor(element, name) {
        this.input0 = new NumericStepperInput(element.querySelector(`fieldset[data-group='${name}'][data-injective='smoothstep'][data-parameter='edge0']`), PrintMapping.UnipolarPercent, NumericStepper.Hundredth);
        this.input1 = new NumericStepperInput(element.querySelector(`fieldset[data-group='${name}'][data-injective='smoothstep'][data-parameter='edge1']`), PrintMapping.UnipolarPercent, NumericStepper.Hundredth);
    }
    with(value) {
        this.input0.with(value.edge0);
        this.input1.with(value.edge1);
    }
    clear() {
        this.input0.with(ObservableValueVoid.Instance);
        this.input1.with(ObservableValueVoid.Instance);
    }
    terminate() {
        this.input0.terminate();
        this.input1.terminate();
    }
}
//# sourceMappingURL=injective.js.map