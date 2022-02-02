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

export const InjectiveTypes = new Map<string, InjectiveType>([
    ["Linear", IdentityInjective],
    ["Power", PowInjective],
    ["CShape", CShapeInjective],
    ["TShape", TShapeInjective],
    ["SmoothStep", SmoothStepInjective]
])

export class InjectiveEditor implements Editor<ObservableValue<Injective<any>>> {
    private readonly terminator: Terminator = new Terminator()
    private readonly typeValue: ObservableValue<InjectiveType> = this.terminator.with(new ObservableValueImpl(InjectiveTypes[0]))
    private readonly typeSelectInput: SelectInput<InjectiveType>

    private readonly powInjectiveEditor: PowInjectiveEditor
    private readonly cShapeInjectiveEditor: CShapeInjectiveEditor
    private readonly tShapeInjectiveEditor: TShapeInjectiveEditor
    private readonly smoothStepInjectiveEditor: SmoothStepInjectiveEditor

    private editable: Option<ObservableValue<Injective<any>>> = Options.None
    private subscription: Option<Terminable> = Options.None

    constructor(private readonly element: Element, private readonly name: string) {
        this.typeSelectInput = this.terminator.with(new SelectInput<InjectiveType>(element
            .querySelector(`select[data-parameter=${name}]`), InjectiveTypes))
        this.typeSelectInput.with(this.typeValue)

        this.powInjectiveEditor = this.terminator.with(new PowInjectiveEditor(element, name))
        this.cShapeInjectiveEditor = this.terminator.with(new CShapeInjectiveEditor(element, name))
        this.tShapeInjectiveEditor = this.terminator.with(new TShapeInjectiveEditor(element, name))
        this.smoothStepInjectiveEditor = this.terminator.with(new SmoothStepInjectiveEditor(element, name))

        this.terminator.with(this.typeValue.addObserver(type => this.editable.ifPresent(value => value.set(new type())), false))
    }

    with(value: ObservableValue<Injective<any>>): void {
        this.subscription.ifPresent(_ => _.terminate())
        this.editable = Options.None
        this.subscription = Options.valueOf(value.addObserver(value => this.updateType(value), true))
        this.editable = Options.valueOf(value)
    }

    clear(): void {
        this.subscription.ifPresent(_ => _.terminate())
        this.subscription = Options.None
        this.editable = Options.None

        this.element.removeAttribute(`data-${this.name}`)
        this.powInjectiveEditor.clear()
        this.cShapeInjectiveEditor.clear()
        this.smoothStepInjectiveEditor.clear()
    }

    terminate(): void {
        this.terminator.terminate()
    }

    private updateType(injective: Injective<any>): void {
        const type: InjectiveType = injective.constructor as InjectiveType
        this.typeValue.set(type)
        if (injective instanceof IdentityInjective) {
            this.element.setAttribute(`data-${this.name}`, "linear")
            this.powInjectiveEditor.clear()
            this.cShapeInjectiveEditor.clear()
            this.tShapeInjectiveEditor.clear()
            this.smoothStepInjectiveEditor.clear()
        } else if (injective instanceof PowInjective) {
            this.element.setAttribute(`data-${this.name}`, "pow")
            this.powInjectiveEditor.with(injective)
            this.cShapeInjectiveEditor.clear()
            this.tShapeInjectiveEditor.clear()
            this.smoothStepInjectiveEditor.clear()
        } else if (injective instanceof CShapeInjective) {
            this.element.setAttribute(`data-${this.name}`, "cshape")
            this.powInjectiveEditor.clear()
            this.cShapeInjectiveEditor.with(injective)
            this.tShapeInjectiveEditor.clear()
            this.smoothStepInjectiveEditor.clear()
        } else if (injective instanceof TShapeInjective) {
            this.element.setAttribute(`data-${this.name}`, "tshape")
            this.powInjectiveEditor.clear()
            this.tShapeInjectiveEditor.with(injective)
            this.cShapeInjectiveEditor.clear()
            this.smoothStepInjectiveEditor.clear()
        } else if (injective instanceof SmoothStepInjective) {
            this.element.setAttribute(`data-${this.name}`, "smoothstep")
            this.powInjectiveEditor.clear()
            this.tShapeInjectiveEditor.clear()
            this.cShapeInjectiveEditor.clear()
            this.smoothStepInjectiveEditor.with(injective)
        }
    }
}

export class PowInjectiveEditor implements Editor<PowInjective> {
    private readonly input: NumericStepperInput

    constructor(element: Element, group: string) {
        this.input = new NumericStepperInput(
            element.querySelector(`fieldset[data-group='${group}'][data-injective='pow'][data-parameter='exponent']`),
            PrintMapping.float(2, "x^", ""), NumericStepper.Hundredth)
    }

    with(value: PowInjective): void {
        this.input.with(value.exponent)
    }

    clear(): void {
        this.input.with(ObservableValueVoid.Instance)
    }

    terminate(): void {
        this.input.terminate()
    }
}

export class CShapeInjectiveEditor implements Editor<CShapeInjective> {
    private readonly input: NumericStepperInput

    constructor(element: Element, name: string) {
        this.input = new NumericStepperInput(
            element.querySelector(`fieldset[data-group='${name}'][data-injective='cshape'][data-parameter='shape']`),
            PrintMapping.float(2, "", ""), NumericStepper.Hundredth)
    }

    with(value: CShapeInjective): void {
        this.input.with(value.slope)
    }

    clear(): void {
        this.input.with(ObservableValueVoid.Instance)
    }

    terminate(): void {
        this.input.terminate()
    }
}

export class TShapeInjectiveEditor implements Editor<TShapeInjective> {
    private readonly input: NumericStepperInput

    constructor(element: Element, name: string) {
        this.input = new NumericStepperInput(
            element.querySelector(`fieldset[data-group='${name}'][data-injective='tshape'][data-parameter='shape']`),
            PrintMapping.UnipolarPercent, NumericStepper.Hundredth)
    }

    with(value: TShapeInjective): void {
        this.input.with(value.shape)
    }

    clear(): void {
        this.input.with(ObservableValueVoid.Instance)
    }

    terminate(): void {
        this.input.terminate()
    }
}

export class SmoothStepInjectiveEditor implements Editor<SmoothStepInjective> {
    private readonly input0: NumericStepperInput
    private readonly input1: NumericStepperInput

    constructor(element: Element, name: string) {
        this.input0 = new NumericStepperInput(
            element.querySelector(`fieldset[data-group='${name}'][data-injective='smoothstep'][data-parameter='edge0']`),
            PrintMapping.UnipolarPercent, NumericStepper.Hundredth)
        this.input1 = new NumericStepperInput(
            element.querySelector(`fieldset[data-group='${name}'][data-injective='smoothstep'][data-parameter='edge1']`),
            PrintMapping.UnipolarPercent, NumericStepper.Hundredth)
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
        this.input0.terminate()
        this.input1.terminate()
    }
}