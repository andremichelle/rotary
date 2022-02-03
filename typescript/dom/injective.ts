import {Editor, SelectInput} from "./inputs.js"
import {
    CShapeInjective,
    IdentityInjective,
    Injective,
    InjectiveType,
    PowInjective,
    SmoothStepInjective,
    TShapeInjective
} from "../lib/injective.js"
import {
    NumericStepper,
    ObservableValue,
    ObservableValueImpl,
    Option,
    Options,
    PrintMapping,
    Terminable,
    Terminator
} from "../lib/common.js"
import {UIControllerLayout} from "./controls.js"

export const InjectiveTypes = new Map<string, InjectiveType>([
    ["Linear", IdentityInjective],
    ["Power", PowInjective],
    ["CShape", CShapeInjective],
    ["TShape", TShapeInjective],
    ["SmoothStep", SmoothStepInjective]
])

export class InjectiveEditor implements Editor<ObservableValue<Injective<any>>> {
    private readonly selectLayout: UIControllerLayout
    private readonly controllerLayout: UIControllerLayout

    private readonly terminator: Terminator = new Terminator()
    private readonly typeValue: ObservableValue<InjectiveType> = this.terminator.with(new ObservableValueImpl(InjectiveTypes[0]))
    private readonly typeSelectInput: SelectInput<InjectiveType>

    private editable: Option<ObservableValue<Injective<any>>> = Options.None
    private subscription: Option<Terminable> = Options.None

    constructor(private readonly parentElement: HTMLElement, name: string) {
        this.selectLayout = this.terminator.with(new UIControllerLayout(parentElement))
        this.controllerLayout = this.terminator.with(new UIControllerLayout(parentElement))

        this.typeSelectInput = this.selectLayout.createSelect(name, InjectiveTypes)
        this.typeSelectInput.with(this.typeValue)
        this.terminator.with(this.typeValue.addObserver(type => this.editable.ifPresent(value => value.set(new type())), false))
    }

    with(value: ObservableValue<Injective<any>>): void {
        this.editable = Options.None
        this.subscription.ifPresent(_ => _.terminate())
        this.subscription = Options.valueOf(value.addObserver(value => this.updateType(value), true))
        this.editable = Options.valueOf(value)
    }

    clear(): void {
        this.subscription.ifPresent(_ => _.terminate())
        this.subscription = Options.None
        this.editable = Options.None
        this.controllerLayout.terminate()
    }

    terminate(): void {
        this.terminator.terminate()
    }

    private updateType(injective: Injective<any>): void {
        this.controllerLayout.terminate()
        const type: InjectiveType = injective.constructor as InjectiveType
        this.typeValue.set(type)
        if (injective instanceof IdentityInjective) {
        } else if (injective instanceof PowInjective) {
            this.controllerLayout.createNumericStepper("exponent",
                PrintMapping.float(2, "x^", ""), NumericStepper.Hundredth)
                .with(injective.exponent)
        } else if (injective instanceof CShapeInjective) {
            this.controllerLayout.createNumericStepper("slope",
                PrintMapping.UnipolarPercent, NumericStepper.Hundredth)
                .with(injective.slope)
        } else if (injective instanceof TShapeInjective) {
            this.controllerLayout.createNumericStepper("shape",
                PrintMapping.UnipolarPercent, NumericStepper.Hundredth)
                .with(injective.shape)
        } else if (injective instanceof SmoothStepInjective) {
            this.controllerLayout.createNumericStepper("edge 0", PrintMapping.UnipolarPercent, NumericStepper.Hundredth)
                .with(injective.edge0)
            this.controllerLayout.createNumericStepper("edge 1", PrintMapping.UnipolarPercent, NumericStepper.Hundredth)
                .with(injective.edge1)
        }
    }
}