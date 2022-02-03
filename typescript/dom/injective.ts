import {Editor, NumericStepperInput, SelectInput} from "./inputs.js"
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
    ObservableValueVoid,
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
    private readonly layout: UIControllerLayout

    private readonly terminator: Terminator = new Terminator()
    private readonly typeValue: ObservableValue<InjectiveType> = this.terminator.with(new ObservableValueImpl(InjectiveTypes[0]))
    private readonly typeSelectInput: SelectInput<InjectiveType>

    private editable: Option<ObservableValue<Injective<any>>> = Options.None
    private subscription: Option<Terminable> = Options.None
    private editor: Option<Editor<any>> = Options.None

    constructor(private readonly parentElement: HTMLElement, name: string) {

        this.layout = new UIControllerLayout(parentElement)

        this.typeSelectInput = this.layout.createSelect(name, InjectiveTypes)
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

        this.editor.ifPresent(editor => editor.terminate())
        this.editor = Options.None
    }

    terminate(): void {
        this.terminator.terminate()
    }

    private updateType(injective: Injective<any>): void {
        this.editor.ifPresent(editor => editor.terminate())
        this.editor = Options.None
        const type: InjectiveType = injective.constructor as InjectiveType
        this.typeValue.set(type)
        if (injective instanceof IdentityInjective) {
        } else if (injective instanceof PowInjective) {
            this.editor = Options.valueOf(new PowInjectiveEditor(this.parentElement))
        } else if (injective instanceof CShapeInjective) {
            this.editor = Options.valueOf(new CShapeInjectiveEditor(this.parentElement))
        } else if (injective instanceof TShapeInjective) {
            this.editor = Options.valueOf(new TShapeInjectiveEditor(this.parentElement))
        } else if (injective instanceof SmoothStepInjective) {
            this.editor = Options.valueOf(new SmoothStepInjectiveEditor(this.parentElement))
        }
        this.editor.ifPresent(editor => editor.with(injective))
    }
}

export class PowInjectiveEditor implements Editor<PowInjective> {
    private readonly layout: UIControllerLayout
    private readonly input: NumericStepperInput

    constructor(parentElement: HTMLElement) {
        this.layout = new UIControllerLayout(parentElement)
        this.input = this.layout
            .createNumericStepper("exponent",
                PrintMapping.float(2, "x^", ""), NumericStepper.Hundredth)
    }

    with(value: PowInjective): void {
        this.input.with(value.exponent)
    }

    clear(): void {
        this.input.with(ObservableValueVoid.Instance)
    }

    terminate(): void {
        this.layout.terminate()
    }
}

export class CShapeInjectiveEditor implements Editor<CShapeInjective> {
    private readonly layout: UIControllerLayout
    private readonly input: NumericStepperInput

    constructor(parentElement: HTMLElement) {
        this.layout = new UIControllerLayout(parentElement)
        this.input = this.layout
            .createNumericStepper("shape",
                PrintMapping.float(2, "", ""), NumericStepper.Hundredth)
    }

    with(value: CShapeInjective): void {
        this.input.with(value.slope)
    }

    clear(): void {
        this.input.with(ObservableValueVoid.Instance)
    }

    terminate(): void {
        this.layout.terminate()
    }
}

export class TShapeInjectiveEditor implements Editor<TShapeInjective> {
    private readonly layout: UIControllerLayout
    private readonly input: NumericStepperInput

    constructor(parentElement: HTMLElement) {
        this.layout = new UIControllerLayout(parentElement)
        this.input = this.layout
            .createNumericStepper("shape",
                PrintMapping.UnipolarPercent, NumericStepper.Hundredth)
    }

    with(value: TShapeInjective): void {
        this.input.with(value.shape)
    }

    clear(): void {
        this.input.with(ObservableValueVoid.Instance)
    }

    terminate(): void {
        this.layout.terminate()
    }
}

export class SmoothStepInjectiveEditor implements Editor<SmoothStepInjective> {
    private readonly layout: UIControllerLayout
    private readonly input0: NumericStepperInput
    private readonly input1: NumericStepperInput

    constructor(parentElement: HTMLElement) {
        this.layout = new UIControllerLayout(parentElement)
        this.input0 = this.layout.createNumericStepper("edge0", PrintMapping.UnipolarPercent, NumericStepper.Hundredth)
        this.input1 = this.layout.createNumericStepper("edge1", PrintMapping.UnipolarPercent, NumericStepper.Hundredth)
    }

    with(value: SmoothStepInjective): void {
        this.input0.with(value.edge0)
        this.input1.with(value.edge1)
    }

    clear(): void {
        this.input0.with(ObservableValueVoid.Instance)
        this.input1.with(ObservableValueVoid.Instance)
    }

    terminate(): void {
        this.layout.terminate()
    }
}