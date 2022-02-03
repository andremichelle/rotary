import { CShapeInjective, IdentityInjective, PowInjective, SmoothStepInjective, TShapeInjective } from "../lib/injective.js";
import { NumericStepper, ObservableValueImpl, Options, PrintMapping, Terminator } from "../lib/common.js";
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
        this.selectLayout = this.terminator.with(new UIControllerLayout(parentElement));
        this.controllerLayout = this.terminator.with(new UIControllerLayout(parentElement));
        this.typeSelectInput = this.selectLayout.createSelect(name, InjectiveTypes);
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
        this.controllerLayout.terminate();
    }
    terminate() {
        this.terminator.terminate();
    }
    updateType(injective) {
        this.controllerLayout.terminate();
        const type = injective.constructor;
        this.typeValue.set(type);
        if (injective instanceof IdentityInjective) {
        }
        else if (injective instanceof PowInjective) {
            this.controllerLayout.createNumericStepper("exponent", PrintMapping.float(2, "x^", ""), NumericStepper.Hundredth)
                .with(injective.exponent);
        }
        else if (injective instanceof CShapeInjective) {
            this.controllerLayout.createNumericStepper("slope", PrintMapping.UnipolarPercent, NumericStepper.Hundredth)
                .with(injective.slope);
        }
        else if (injective instanceof TShapeInjective) {
            this.controllerLayout.createNumericStepper("shape", PrintMapping.UnipolarPercent, NumericStepper.Hundredth)
                .with(injective.shape);
        }
        else if (injective instanceof SmoothStepInjective) {
            this.controllerLayout.createNumericStepper("edge 0", PrintMapping.UnipolarPercent, NumericStepper.Hundredth)
                .with(injective.edge0);
            this.controllerLayout.createNumericStepper("edge 1", PrintMapping.UnipolarPercent, NumericStepper.Hundredth)
                .with(injective.edge1);
        }
    }
}
//# sourceMappingURL=injective.js.map