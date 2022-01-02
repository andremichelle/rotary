import {NumericStepper, ObservableValueVoid, Terminable, Terminator} from "../lib/common"
import {NumericInput, NumericStepperInput, SelectInput} from "../dom/inputs"
import {Fill, Fills, RotaryTrackModel} from "./model"
import {Dom} from "../dom/common"
import {PrintMapping} from "../lib/mapping"

export interface RotaryTrackEditorExecutor {
    delete(subject: RotaryTrackModel): void
}

export class RotaryTrackEditor implements Terminable {
    private readonly terminator: Terminator = new Terminator()
    private readonly segments: NumericStepperInput
    private readonly width: NumericStepperInput
    private readonly widthPadding: NumericStepperInput
    private readonly length: NumericStepperInput
    private readonly lengthRatio: NumericStepperInput
    private readonly fill: SelectInput<Fill>
    private readonly rgb: NumericInput

    subject: RotaryTrackModel | null = null

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

        this.terminator.with(Dom.bindEventListener(parentNode.querySelector("button.delete"), "click", event => {
            event.preventDefault()
            if (this.subject !== null) {
                executor.delete(this.subject)
            }
        }))
    }

    edit(model: RotaryTrackModel): void {
        this.segments.withValue(model.segments)
        this.width.withValue(model.width)
        this.widthPadding.withValue(model.widthPadding)
        this.length.withValue(model.length)
        this.lengthRatio.withValue(model.lengthRatio)
        this.fill.withValue(model.fill)
        this.rgb.withValue(model.rgb)

        this.subject = model
    }

    clear(): void {
        this.segments.withValue(ObservableValueVoid.Instance)
        this.width.withValue(ObservableValueVoid.Instance)
        this.widthPadding.withValue(ObservableValueVoid.Instance)
        this.length.withValue(ObservableValueVoid.Instance)
        this.lengthRatio.withValue(ObservableValueVoid.Instance)
        this.fill.withValue(ObservableValueVoid.Instance)
        this.rgb.withValue(ObservableValueVoid.Instance)

        this.subject = null
    }

    terminate() {
        this.terminator.terminate()
    }
}