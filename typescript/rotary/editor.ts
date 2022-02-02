import {ArrayUtils, NumericStepper, Option, Options, PrintMapping, Terminable, Terminator} from "../lib/common.js"
import {Checkbox, NumericInput, NumericStepperInput, SelectInput} from "../dom/inputs.js"
import {Fill, Fills, RotaryModel, RotaryTrackModel} from "./model.js"
import {InjectiveEditor} from "../dom/injective.js"
import {Dom} from "../dom/common.js"

export interface RotaryTrackEditorExecutor {
    deleteTrack(trackModel: RotaryTrackModel): void

    moveTrackLeft(trackModel: RotaryTrackModel): void

    moveTrackRight(trackModel: RotaryTrackModel): void
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
    private readonly motion: InjectiveEditor
    private readonly rgb: NumericInput
    private readonly phaseOffset: NumericStepperInput
    private readonly bend: InjectiveEditor
    private readonly frequency: NumericStepperInput
    private readonly fragments: NumericStepperInput
    private readonly reverse: Checkbox

    private readonly volume: NumericStepperInput
    private readonly panning: NumericStepperInput
    private readonly auxSends: NumericStepperInput[]

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
        this.motion = new InjectiveEditor(parentNode.querySelector(".track-editor"), "motion")
        this.bend = this.terminator.with(new InjectiveEditor(parentNode.querySelector(".track-editor"), "bend"))
        this.phaseOffset = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='phase-offset']"),
            PrintMapping.UnipolarPercent, NumericStepper.Hundredth))
        this.frequency = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='frequency']"),
            PrintMapping.integer("x"), NumericStepper.Integer))
        this.fragments = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='fragments']"),
            PrintMapping.integer("x"), NumericStepper.Integer))
        this.reverse = this.terminator.with(new Checkbox(parentNode.querySelector("input[data-parameter='reverse']")))

        this.volume = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='volume']"),
            PrintMapping.UnipolarPercent, NumericStepper.Hundredth))
        this.panning = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='panning']"),
            PrintMapping.UnipolarPercent, NumericStepper.Hundredth))
        this.auxSends = ArrayUtils.fill(RotaryModel.NUM_AUX, (index: number) =>
            this.terminator.with(new NumericStepperInput(parentNode.querySelector(`fieldset[data-parameter='aux-${index}']`),
                PrintMapping.UnipolarPercent, NumericStepper.Hundredth)))

        this.terminator.with(Dom.bindEventListener(parentNode.querySelector("button.delete"), "click", event => {
            event.preventDefault()
            this.subject.ifPresent((trackModel: RotaryTrackModel) => executor.deleteTrack(trackModel))
        }))
        this.terminator.with(Dom.bindEventListener(parentNode.querySelector("button.move-left"), "click", event => {
            event.preventDefault()
            this.subject.ifPresent((trackModel: RotaryTrackModel) => executor.moveTrackLeft(trackModel))
        }))
        this.terminator.with(Dom.bindEventListener(parentNode.querySelector("button.move-right"), "click", event => {
            event.preventDefault()
            this.subject.ifPresent((trackModel: RotaryTrackModel) => executor.moveTrackRight(trackModel))
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
        this.bend.with(model.bend)
        this.phaseOffset.with(model.phaseOffset)
        this.frequency.with(model.frequency)
        this.fragments.with(model.fragments)
        this.reverse.with(model.reverse)

        this.volume.with(model.volume)
        this.panning.with(model.panning)
        this.auxSends[0].with(model.aux[0])
        this.auxSends[1].with(model.aux[1])
        this.auxSends[2].with(model.aux[2])
        this.auxSends[3].with(model.aux[3])

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
        this.bend.clear()
        this.phaseOffset.clear()
        this.frequency.clear()
        this.fragments.clear()
        this.reverse.clear()

        this.volume.clear()
        this.panning.clear()
        this.auxSends[0].clear()
        this.auxSends[1].clear()
        this.auxSends[2].clear()
        this.auxSends[3].clear()
    }

    terminate() {
        this.clear()
        this.terminator.terminate()
    }
}