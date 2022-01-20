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
import {Checkbox, Editor, NumericInput, NumericStepperInput, SelectInput} from "../dom/inputs.js"
import {Fill, Fills, MotionTypes, RotaryTrackModel} from "./model.js"
import {Dom} from "../dom/common.js"
import {CShapeMotion, LinearMotion, Motion, MotionType, PowMotion, SmoothStepMotion, TShapeMotion} from "./motion.js"

export interface RotaryTrackEditorExecutor {
    deleteTrack(): void
}

export class PowMotionEditor implements Editor<PowMotion> {
    private readonly input: NumericStepperInput

    constructor(element: Element) {
        this.input = new NumericStepperInput(
            element.querySelector("fieldset[data-motion='pow'][data-parameter='exponent']"),
            PrintMapping.float(2, "x^", ""), NumericStepper.Hundredth)
    }

    with(value: PowMotion): void {
        this.input.with(value.exponent)
    }

    clear(): void {
        this.input.with(ObservableValueVoid.Instance)
    }

    terminate(): void {
        this.input.terminate()
    }
}

export class CShapeMotionEditor implements Editor<CShapeMotion> {
    private readonly input: NumericStepperInput

    constructor(element: Element) {
        this.input = new NumericStepperInput(
            element.querySelector("fieldset[data-motion='cshape'][data-parameter='shape']"),
            PrintMapping.float(2, "", ""), NumericStepper.Hundredth)
    }

    with(value: CShapeMotion): void {
        this.input.with(value.slope)
    }

    clear(): void {
        this.input.with(ObservableValueVoid.Instance)
    }

    terminate(): void {
        this.input.terminate()
    }
}

export class TShapeMotionEditor implements Editor<TShapeMotion> {
    private readonly input: NumericStepperInput

    constructor(element: Element) {
        this.input = new NumericStepperInput(
            element.querySelector("fieldset[data-motion='tshape'][data-parameter='shape']"),
            PrintMapping.UnipolarPercent, NumericStepper.Hundredth)
    }

    with(value: TShapeMotion): void {
        this.input.with(value.shape)
    }

    clear(): void {
        this.input.with(ObservableValueVoid.Instance)
    }

    terminate(): void {
        this.input.terminate()
    }
}

export class SmoothStepMotionEditor implements Editor<SmoothStepMotion> {
    private readonly input0: NumericStepperInput
    private readonly input1: NumericStepperInput

    constructor(element: Element) {
        this.input0 = new NumericStepperInput(
            element.querySelector("fieldset[data-motion='smoothstep'][data-parameter='edge0']"),
            PrintMapping.UnipolarPercent, NumericStepper.Hundredth)
        this.input1 = new NumericStepperInput(
            element.querySelector("fieldset[data-motion='smoothstep'][data-parameter='edge1']"),
            PrintMapping.UnipolarPercent, NumericStepper.Hundredth)
    }

    with(value: SmoothStepMotion): void {
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

export class MotionEditor implements Editor<ObservableValue<Motion<any>>> {
    private readonly terminator: Terminator = new Terminator()
    private readonly motionTypeValue: ObservableValue<MotionType> = this.terminator.with(new ObservableValueImpl(MotionTypes[0]))
    private readonly typeSelectInput: SelectInput<MotionType>

    private readonly powMotionEditor: PowMotionEditor
    private readonly cShapeMotionEditor: CShapeMotionEditor
    private readonly tShapeMotionEditor: TShapeMotionEditor
    private readonly smoothStepMotionEditor: SmoothStepMotionEditor

    private editable: Option<ObservableValue<Motion<any>>> = Options.None
    private subscription: Option<Terminable> = Options.None

    constructor(private readonly editor: RotaryTrackEditor, private readonly element: Element) {
        this.typeSelectInput = this.terminator.with(new SelectInput<MotionType>(element.querySelector("select[data-parameter='motion']"), MotionTypes))
        this.typeSelectInput.with(this.motionTypeValue)

        this.powMotionEditor = this.terminator.with(new PowMotionEditor(element))
        this.cShapeMotionEditor = this.terminator.with(new CShapeMotionEditor(element))
        this.tShapeMotionEditor = this.terminator.with(new TShapeMotionEditor(element))
        this.smoothStepMotionEditor = this.terminator.with(new SmoothStepMotionEditor(element))

        this.terminator.with(this.motionTypeValue.addObserver(motionType => this.editable.ifPresent(value => value.set(new motionType()))))
    }

    with(value: ObservableValue<Motion<any>>): void {
        this.subscription.ifPresent(_ => _.terminate())
        this.editable = Options.None
        this.subscription = Options.valueOf(value.addObserver(value => this.updateMotionType(value)))
        this.updateMotionType(value.get())
        this.editable = Options.valueOf(value)
    }

    clear(): void {
        this.subscription.ifPresent(_ => _.terminate())
        this.subscription = Options.None
        this.editable = Options.None

        this.element.removeAttribute("data-motion")
        this.powMotionEditor.clear()
        this.cShapeMotionEditor.clear()
        this.smoothStepMotionEditor.clear()
    }

    terminate(): void {
        this.terminator.terminate()
    }

    private updateMotionType(motion: Motion<any>): void {
        const motionType: MotionType = motion.constructor as MotionType
        this.motionTypeValue.set(motionType)
        if (motion instanceof LinearMotion) {
            this.element.setAttribute("data-motion", "linear")
            this.powMotionEditor.clear()
            this.cShapeMotionEditor.clear()
            this.tShapeMotionEditor.clear()
            this.smoothStepMotionEditor.clear()
        } else if (motion instanceof PowMotion) {
            this.element.setAttribute("data-motion", "pow")
            this.powMotionEditor.with(motion)
            this.cShapeMotionEditor.clear()
            this.tShapeMotionEditor.clear()
            this.smoothStepMotionEditor.clear()
        } else if (motion instanceof CShapeMotion) {
            this.element.setAttribute("data-motion", "cshape")
            this.powMotionEditor.clear()
            this.cShapeMotionEditor.with(motion)
            this.tShapeMotionEditor.clear()
            this.smoothStepMotionEditor.clear()
        } else if (motion instanceof TShapeMotion) {
            this.element.setAttribute("data-motion", "tshape")
            this.powMotionEditor.clear()
            this.tShapeMotionEditor.with(motion)
            this.cShapeMotionEditor.clear()
            this.smoothStepMotionEditor.clear()
        } else if (motion instanceof SmoothStepMotion) {
            this.element.setAttribute("data-motion", "smoothstep")
            this.powMotionEditor.clear()
            this.tShapeMotionEditor.clear()
            this.cShapeMotionEditor.clear()
            this.smoothStepMotionEditor.with(motion)
        }
    }
}

export class RotaryTrackEditor implements Terminable {
    private readonly terminator: Terminator = new Terminator()
    private readonly segments: NumericStepperInput
    private readonly width: NumericStepperInput
    private readonly widthPadding: NumericStepperInput
    private readonly length: NumericStepperInput
    private readonly lengthRatio: NumericStepperInput
    private readonly outline: NumericStepperInput
    private readonly fill: SelectInput<Fill>
    private readonly motion: MotionEditor
    private readonly rgb: NumericInput
    private readonly phaseOffset: NumericStepperInput
    private readonly bend: NumericStepperInput
    private readonly frequency: NumericStepperInput
    private readonly reverse: Checkbox

    subject: Option<RotaryTrackModel> = Options.None

    constructor(private readonly executor: RotaryTrackEditorExecutor, parentNode: ParentNode) {
        this.segments = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='segments']"),
            PrintMapping.integer(""), NumericStepper.Integer))
        this.width = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='width']"),
            PrintMapping.integer("px"), NumericStepper.Integer))
        this.widthPadding = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='width-padding']"),
            PrintMapping.integer("px"), NumericStepper.Integer))
        this.length = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='length']"),
            PrintMapping.UnipolarPercent, NumericStepper.Hundredth))
        this.lengthRatio = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='length-ratio']"),
            PrintMapping.UnipolarPercent, NumericStepper.Hundredth))
        this.outline = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='outline']"),
            PrintMapping.integer("px"), NumericStepper.Integer))
        this.fill = this.terminator.with(new SelectInput<Fill>(parentNode.querySelector("select[data-parameter='fill']"), Fills))
        this.rgb = this.terminator.with(new NumericInput(parentNode.querySelector("input[data-parameter='rgb']"), PrintMapping.RGB))
        this.motion = new MotionEditor(this, parentNode.querySelector(".track-editor"))
        this.phaseOffset = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='phase-offset']"),
            PrintMapping.UnipolarPercent, NumericStepper.Hundredth))
        this.bend = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='bend']"),
            PrintMapping.UnipolarPercent, NumericStepper.Hundredth))
        this.frequency = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='frequency']"),
            PrintMapping.integer("x"), NumericStepper.Integer))
        this.reverse = this.terminator.with(new Checkbox(parentNode.querySelector("input[data-parameter='reverse']")))

        this.terminator.with(Dom.bindEventListener(parentNode.querySelector("button.delete"), "click", event => {
            event.preventDefault()
            this.subject.ifPresent(() => executor.deleteTrack())
        }))
    }

    edit(model: RotaryTrackModel): void {
        this.segments.with(model.segments)
        this.width.with(model.width)
        this.widthPadding.with(model.widthPadding)
        this.length.with(model.length)
        this.lengthRatio.with(model.lengthRatio)
        this.outline.with(model.outline)
        this.fill.with(model.fill)
        this.rgb.with(model.rgb)
        this.motion.with(model.motion)
        this.phaseOffset.with(model.phaseOffset)
        this.bend.with(model.bend)
        this.frequency.with(model.frequency)
        this.reverse.with(model.reverse)
        this.subject = Options.valueOf(model)
    }

    clear(): void {
        this.subject = Options.None
        this.segments.clear()
        this.width.clear()
        this.widthPadding.clear()
        this.length.clear()
        this.lengthRatio.clear()
        this.outline.clear()
        this.fill.clear()
        this.rgb.clear()
        this.motion.clear()
        this.phaseOffset.clear()
        this.bend.clear()
        this.frequency.clear()
        this.reverse.clear()
    }

    terminate() {
        this.clear()
        this.terminator.terminate()
    }
}