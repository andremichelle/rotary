import { CShapeInjective, IdentityInjective, PowInjective, SmoothStepInjective, TShapeInjective } from "../lib/injective.js";
import { NumericStepper, ObservableValueImpl, ObservableValueVoid, Options, PrintMapping, Terminator } from "../lib/common.js";
import { UIControllerLayout } from "./controls.js";
export const InjectiveTypes = new Map([
    ["Linear", IdentityInjective],
    ["Power", PowInjective],
    ["CShape", CShapeInjective],
    ["TShape", TShapeInjective],
    ["SmoothStep", SmoothStepInjective]
]);
export class InjectiveEditor {
    constructor(parentElement, name) {
        this.parentElement = parentElement;
        this.terminator = new Terminator();
        this.typeValue = this.terminator.with(new ObservableValueImpl(InjectiveTypes[0]));
        this.editable = Options.None;
        this.subscription = Options.None;
        this.editor = Options.None;
        this.layout = new UIControllerLayout(parentElement);
        this.typeSelectInput = this.layout.createSelect(name, InjectiveTypes);
        this.typeSelectInput.with(this.typeValue);
        this.terminator.with(this.typeValue.addObserver(type => this.editable.ifPresent(value => value.set(new type())), false));
    }
    with(value) {
        this.editable = Options.None;
        this.subscription.ifPresent(_ => _.terminate());
        this.subscription = Options.valueOf(value.addObserver(value => this.updateType(value), true));
        this.editable = Options.valueOf(value);
    }
    clear() {
        this.subscription.ifPresent(_ => _.terminate());
        this.subscription = Options.None;
        this.editable = Options.None;
        this.editor.ifPresent(editor => editor.terminate());
        this.editor = Options.None;
    }
    terminate() {
        this.terminator.terminate();
    }
    updateType(injective) {
        this.editor.ifPresent(editor => editor.terminate());
        this.editor = Options.None;
        const type = injective.constructor;
        this.typeValue.set(type);
        if (injective instanceof IdentityInjective) {
        }
        else if (injective instanceof PowInjective) {
            this.editor = Options.valueOf(new PowInjectiveEditor(this.parentElement));
        }
        else if (injective instanceof CShapeInjective) {
            this.editor = Options.valueOf(new CShapeInjectiveEditor(this.parentElement));
        }
        else if (injective instanceof TShapeInjective) {
            this.editor = Options.valueOf(new TShapeInjectiveEditor(this.parentElement));
        }
        else if (injective instanceof SmoothStepInjective) {
            this.editor = Options.valueOf(new SmoothStepInjectiveEditor(this.parentElement));
        }
        this.editor.ifPresent(editor => editor.with(injective));
    }
}
export class PowInjectiveEditor {
    constructor(parentElement) {
        this.layout = new UIControllerLayout(parentElement);
        this.input = this.layout
            .createNumericStepper("exponent", PrintMapping.float(2, "x^", ""), NumericStepper.Hundredth);
    }
    with(value) {
        this.input.with(value.exponent);
    }
    clear() {
        this.input.with(ObservableValueVoid.Instance);
    }
    terminate() {
        this.layout.terminate();
    }
}
export class CShapeInjectiveEditor {
    constructor(parentElement) {
        this.layout = new UIControllerLayout(parentElement);
        this.input = this.layout
            .createNumericStepper("shape", PrintMapping.float(2, "", ""), NumericStepper.Hundredth);
    }
    with(value) {
        this.input.with(value.slope);
    }
    clear() {
        this.input.with(ObservableValueVoid.Instance);
    }
    terminate() {
        this.layout.terminate();
    }
}
export class TShapeInjectiveEditor {
    constructor(parentElement) {
        this.layout = new UIControllerLayout(parentElement);
        this.input = this.layout
            .createNumericStepper("shape", PrintMapping.UnipolarPercent, NumericStepper.Hundredth);
    }
    with(value) {
        this.input.with(value.shape);
    }
    clear() {
        this.input.with(ObservableValueVoid.Instance);
    }
    terminate() {
        this.layout.terminate();
    }
}
export class SmoothStepInjectiveEditor {
    constructor(parentElement) {
        this.layout = new UIControllerLayout(parentElement);
        this.input0 = this.layout.createNumericStepper("edge0", PrintMapping.UnipolarPercent, NumericStepper.Hundredth);
        this.input1 = this.layout.createNumericStepper("edge1", PrintMapping.UnipolarPercent, NumericStepper.Hundredth);
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
        this.layout.terminate();
    }
}
//# sourceMappingURL=injective.js.map