import {NumericStepper, PrintMapping, TAU, Terminable, Terminator} from "../lib/common";
import {Fill, Fills, Move, Movements, RotaryModel, RotaryTrackModel} from "./model";
import {Checkbox, NumericInput, NumericStepperInput, SelectInput} from "../dom/inputs";
import {Dom} from "../dom/common";

export class RotaryView {
    static create(document: Document, rotary: RotaryModel): RotaryView {
        const tracksContainer = document.querySelector(".tracks")
        const trackTemplate = document.querySelector(".track")
        trackTemplate.remove()
        return new RotaryView(tracksContainer, trackTemplate, rotary)
    }

    private readonly terminator: Terminator = new Terminator()
    private readonly map: Map<RotaryTrackModel, RotaryTrackView> = new Map()

    constructor(private readonly tracksContainer: Element,
                private readonly trackTemplate: Element,
                private readonly rotary: RotaryModel) {
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='start-radius']"),
            PrintMapping.integer("px"), new NumericStepper(1))).withValue(rotary.radiusMin)

        rotary.tracks.forEach(track => this.createView(track))
        this.updateOrder()
    }

    draw(context: CanvasRenderingContext2D, position: number): void {
        let radiusMin = this.rotary.radiusMin.get()
        for (let i = 0; i < this.rotary.tracks.length; i++) {
            const view = this.map.get(this.rotary.tracks[i])
            view.draw(context, radiusMin, position)
            radiusMin += view.model.width.get() + view.model.widthPadding.get()
        }
    }

    createView(model: RotaryTrackModel): void {
        this.map.set(model, new RotaryTrackView(this, this.trackTemplate.cloneNode(true) as HTMLElement, model))
    }

    copyTrack(view: RotaryTrackView): void {
        const index = this.rotary.tracks.indexOf(view.model)
        console.assert(-1 !== index, "could find model")
        this.createView(this.rotary.copyTrack(view.model, index + 1))
        this.updateOrder()
    }

    newTrackAfter(view: RotaryTrackView): void {
        const index = this.rotary.tracks.indexOf(view.model)
        console.assert(-1 !== index, "could find model")
        this.createView(this.rotary.createTrack(index + 1))
        this.updateOrder()
    }

    removeTrack(view: RotaryTrackView): void {
        this.map.delete(view.model)
        this.rotary.removeTrack(view.model)
        view.element.remove()
        view.terminate()
    }

    updateOrder(): void {
        Dom.emptyElement(this.tracksContainer)
        this.rotary.tracks.forEach(track => this.tracksContainer.appendChild(this.map.get(track).element))
    }
}

export class RotaryTrackView implements Terminable {
    private readonly terminator: Terminator = new Terminator()
    private readonly segments: NumericStepperInput
    private readonly width: NumericStepperInput
    private readonly widthPadding: NumericStepperInput
    private readonly length: NumericStepperInput
    private readonly lengthRatio: NumericStepperInput
    private readonly phase: NumericStepperInput
    private readonly fill: SelectInput<Fill>
    private readonly rgb: NumericInput
    private readonly movement: SelectInput<Move>
    private readonly reverse: Checkbox

    constructor(readonly view: RotaryView, readonly element: HTMLElement, readonly model: RotaryTrackModel) {
        this.segments = this.terminator.with(new NumericStepperInput(element.querySelector("fieldset[data-parameter='segments']"),
            PrintMapping.integer(""), NumericStepper.Integer)).withValue(model.segments)
        this.width = this.terminator.with(new NumericStepperInput(element.querySelector("fieldset[data-parameter='width']"),
            PrintMapping.integer("px"), NumericStepper.Integer)).withValue(model.width)
        this.widthPadding = this.terminator.with(new NumericStepperInput(element.querySelector("fieldset[data-parameter='width-padding']"),
            PrintMapping.integer("px"), NumericStepper.Integer)).withValue(model.widthPadding)
        this.length = this.terminator.with(new NumericStepperInput(element.querySelector("fieldset[data-parameter='length']"),
            PrintMapping.UnipolarPercent, NumericStepper.FloatPercent)).withValue(model.length)
        this.lengthRatio = this.terminator.with(new NumericStepperInput(element.querySelector("fieldset[data-parameter='length-ratio']"),
            PrintMapping.UnipolarPercent, NumericStepper.FloatPercent)).withValue(model.lengthRatio)
        this.phase = this.terminator.with(new NumericStepperInput(element.querySelector("fieldset[data-parameter='phase']"),
            PrintMapping.UnipolarPercent, NumericStepper.FloatPercent)).withValue(model.phase)
        this.fill = this.terminator.with(new SelectInput<Fill>(element.querySelector("select[data-parameter='fill']"), Fills)).withValue(model.fill)
        this.movement = this.terminator.with(new SelectInput<Move>(element.querySelector("select[data-parameter='movement']"), Movements)).withValue(model.movement)
        this.reverse = this.terminator.with(new Checkbox(element.querySelector("input[data-parameter='reverse']"))).withValue(model.reverse)
        this.rgb = this.terminator.with(new NumericInput(element.querySelector("input[data-parameter='rgb']"), PrintMapping.RGB)).withValue(model.rgb)

        const removeButton = element.querySelector("button[data-action='remove']") as HTMLButtonElement
        removeButton.onclick = () => view.removeTrack(this)
        const newButton = element.querySelector("button[data-action='new']") as HTMLButtonElement
        newButton.onclick = () => view.newTrackAfter(this)
        const copyButton = element.querySelector("button[data-action='copy']") as HTMLButtonElement
        copyButton.onclick = () => view.copyTrack(this)
    }

    draw(context: CanvasRenderingContext2D, radiusMin: number, position: number): void {
        const segments = this.model.segments.get();
        const scale = this.model.length.get() / segments
        const phase = this.model.movement.get()(position - Math.floor(position)) * (this.model.reverse.get() ? -1 : 1) + this.model.phase.get()
        const width = this.model.width.get()
        const thickness = this.model.widthPadding.get() * 0.5
        const r0 = radiusMin + thickness
        const r1 = radiusMin + thickness + width
        for (let i = 0; i < segments; i++) {
            const angleMin = i * scale + phase
            const angleMax = angleMin + scale * this.model.lengthRatio.get()
            this.drawSection(context, r0, r1, angleMin, angleMax, this.model.fill.get())
        }
    }

    drawSection(context: CanvasRenderingContext2D,
                radiusMin: number, radiusMax: number,
                angleMin: number, angleMax: number,
                fill: Fill = Fill.Flat) {
        console.assert(radiusMin < radiusMax, `radiusMax(${radiusMax}) must be greater then radiusMin(${radiusMin})`)
        console.assert(angleMin < angleMax, `angleMax(${angleMax}) must be greater then angleMin(${angleMin})`)
        const radianMin = angleMin * TAU
        const radianMax = angleMax * TAU
        if (fill === Fill.Flat) {
            context.fillStyle = this.model.opaque()
        } else if (fill === Fill.Stroke || fill === Fill.Line) {
            context.strokeStyle = this.model.opaque()
        } else {
            const gradient: CanvasGradient = context.createConicGradient(radianMin, 0.0, 0.0)
            const offset = Math.min(angleMax - angleMin, 1.0)
            if (fill === Fill.Positive) {
                gradient.addColorStop(0.0, this.model.transparent())
                gradient.addColorStop(offset, this.model.opaque())
                gradient.addColorStop(offset, this.model.transparent()) // eliminates tiny glitches at the end of the tail
            } else if (fill === Fill.Negative) {
                gradient.addColorStop(0.0, this.model.opaque())
                gradient.addColorStop(offset, this.model.transparent())
            }
            context.fillStyle = gradient
        }
        if(fill === Fill.Line) {
            const sn = Math.sin(radianMin)
            const cs = Math.cos(radianMin)
            context.beginPath()
            context.moveTo(cs * radiusMin, sn * radiusMin)
            context.lineTo(cs * radiusMax, sn * radiusMax)
            context.closePath()
        } else {
            context.beginPath()
            context.arc(0.0, 0.0, radiusMax, radianMin, radianMax, false)
            context.arc(0.0, 0.0, radiusMin, radianMax, radianMin, true)
            context.closePath()
        }
        if (fill === Fill.Stroke || fill === Fill.Line) {
            context.stroke()
        } else {
            context.fill()
        }
    }

    terminate() {
        this.terminator.terminate()
    }
}