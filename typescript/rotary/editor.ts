import {
    NumericStepper,
    ObservableValue,
    ObservableValueImpl,
    ObservableValueVoid,
    Option,
    Options,
    Terminable,
    Terminator
} from "../lib/common"
import {Checkbox, NumericInput, NumericStepperInput, SelectInput} from "../dom/inputs"
import {Fill, Fills, MotionTypes, RotaryTrackModel} from "./model"
import {Dom} from "../dom/common"
import {PrintMapping} from "../lib/mapping"
import {CShapeMotion, LinearMotion, MotionType, PowMotion, SmoothStepMotion} from "./motion"

export interface RotaryTrackEditorExecutor {
    deleteTrack(): void
}

export class RotaryTrackEditor implements Terminable {
    private readonly terminator: Terminator = new Terminator()
    private readonly segments: NumericStepperInput
    private readonly width: NumericStepperInput
    private readonly widthPadding: NumericStepperInput
    private readonly length: NumericStepperInput
    private readonly lengthRatio: NumericStepperInput
    private readonly fill: SelectInput<Fill>
    private readonly motion: SelectInput<MotionType>
    private readonly rgb: NumericInput
    private readonly phaseOffset: NumericStepperInput
    private readonly frequency: NumericStepperInput
    private readonly reverse: Checkbox

    private readonly editTerminator: Terminator = new Terminator()
    private readonly editMotionType: ObservableValue<MotionType> = new ObservableValueImpl(MotionTypes[0])

    subject: Option<RotaryTrackModel> = Options.None

    constructor(private readonly executor: RotaryTrackEditorExecutor, parentNode: ParentNode) {
        this.segments = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='segments']"),
            PrintMapping.integer(""), NumericStepper.Integer))
        this.width = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='width']"),
            PrintMapping.integer("px"), NumericStepper.Integer))
        this.widthPadding = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='width-padding']"),
            PrintMapping.integer("px"), NumericStepper.Integer))
        this.length = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='length']"),
            PrintMapping.UnipolarPercent, NumericStepper.FloatPercent))
        this.lengthRatio = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='length-ratio']"),
            PrintMapping.UnipolarPercent, NumericStepper.FloatPercent))
        this.fill = this.terminator.with(new SelectInput<Fill>(parentNode.querySelector("select[data-parameter='fill']"), Fills))
        this.rgb = this.terminator.with(new NumericInput(parentNode.querySelector("input[data-parameter='rgb']"), PrintMapping.RGB))
        this.motion = this.terminator.with(new SelectInput<MotionType>(parentNode.querySelector("select[data-parameter='motion']"), MotionTypes))
            .withValue(this.editMotionType)
        this.phaseOffset = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='phase-offset']"),
            PrintMapping.UnipolarPercent, NumericStepper.FloatPercent))
        this.frequency = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='frequency']"),
            PrintMapping.integer("x"), NumericStepper.Integer))
        this.reverse = this.terminator.with(new Checkbox(parentNode.querySelector("input[data-parameter='reverse']")))

        this.terminator.with(Dom.bindEventListener(parentNode.querySelector("button.delete"), "click", event => {
            event.preventDefault()
            this.subject.ifPresent(() => executor.deleteTrack())
        }))
        this.terminator.with(this.editMotionType.addObserver(motionType =>
            this.subject.ifPresent(model => model.motion.set(new motionType()))))
    }

    edit(model: RotaryTrackModel): void {
        this.editTerminator.terminate()

        this.segments.withValue(model.segments)
        this.width.withValue(model.width)
        this.widthPadding.withValue(model.widthPadding)
        this.length.withValue(model.length)
        this.lengthRatio.withValue(model.lengthRatio)
        this.fill.withValue(model.fill)
        this.rgb.withValue(model.rgb)
        this.phaseOffset.withValue(model.phaseOffset)
        this.frequency.withValue(model.frequency)
        this.reverse.withValue(model.reverse)

        this.editTerminator.with({terminate: () => this.subject = Options.None})
        this.editTerminator.with(model.motion.addObserver(() => this.updateMotionType(model)))
        this.updateMotionType(model)

        this.subject = Options.valueOf(model)
    }

    clear(): void {
        this.editTerminator.terminate()
        this.segments.withValue(ObservableValueVoid.Instance)
        this.width.withValue(ObservableValueVoid.Instance)
        this.widthPadding.withValue(ObservableValueVoid.Instance)
        this.length.withValue(ObservableValueVoid.Instance)
        this.lengthRatio.withValue(ObservableValueVoid.Instance)
        this.fill.withValue(ObservableValueVoid.Instance)
        this.rgb.withValue(ObservableValueVoid.Instance)
        this.phaseOffset.withValue(ObservableValueVoid.Instance)
        this.frequency.withValue(ObservableValueVoid.Instance)
        this.reverse.withValue(ObservableValueVoid.Instance)
    }

    terminate() {
        this.terminator.terminate()
    }

    private updateMotionType(model: RotaryTrackModel): void {
        const motionType: MotionType = model.motion.get().constructor as MotionType
        console.log(`updateMotionType: ${motionType.name}`)
        this.editMotionType.set(motionType)

        // TODO Update Motion Editor
        switch (motionType) {
            case LinearMotion: {
                console.log("LinearMotion")
                break
            }
            case PowMotion: {
                console.log("PowMotion")
                break
            }
            case CShapeMotion: {
                console.log("CShapeMotion")
                break
            }
            case SmoothStepMotion: {
                console.log("SmoothStepMotion")
                break
            }
        }
    }
}