import {PrintMapping, TAU, Terminable, Terminator} from "../lib/common";
import {Fill, Fills, Movements, RotaryModel, RotaryTrackModel} from "./model";
import {NumericStepper} from "../controls";
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
        this.terminator.with(new NumericStepper(document.querySelector("[data-parameter='start-radius']"), rotary.radiusMin, PrintMapping.NoFloat, 1, "px"))

        rotary.tracks.forEach(track => this.createView(track))
        this.updateViews()
    }

    draw(context: CanvasRenderingContext2D, position: number): void {
        let radiusMin = this.rotary.radiusMin.get()
        for (let i = 0; i < this.rotary.tracks.length; i++) {
            const view = this.map.get(this.rotary.tracks[i])
            view.draw(context, radiusMin, position)
            radiusMin += view.model.width.get()
        }
    }

    createView(model: RotaryTrackModel): void {
        this.map.set(model, new RotaryTrackView(this, this.trackTemplate.cloneNode(true) as HTMLElement, model))
    }

    copyTrack(view: RotaryTrackView) {
        const index = this.rotary.tracks.indexOf(view.model)
        console.assert(-1 !== index, "could find model")
        this.createView(this.rotary.copyTrack(view.model, index + 1))
        this.updateViews()
    }

    newTrackAfter(view: RotaryTrackView) {
        const index = this.rotary.tracks.indexOf(view.model)
        console.assert(-1 !== index, "could find model")
        this.createView(this.rotary.createTrack(index + 1))
        this.updateViews()
    }

    removeTrack(view: RotaryTrackView) {
        this.map.delete(view.model)
        this.rotary.removeTrack(view.model)
        view.element.remove()
        view.terminate()
    }

    updateViews() {
        Dom.emptyElement(this.tracksContainer)
        this.rotary.tracks.forEach(track => this.tracksContainer.appendChild(this.map.get(track).element))
    }
}

export class RotaryTrackView implements Terminable {
    static WHITE = "white"
    static TRANSPARENT = "rgba(255, 255, 255, 0.0)"

    private readonly terminator: Terminator = new Terminator()
    private readonly segments: NumericStepper
    private readonly width: NumericStepper
    private readonly widthRatio: NumericStepper
    private readonly length: NumericStepper
    private readonly lengthRatio: NumericStepper
    private readonly phase: NumericStepper
    private readonly fill: Terminable
    private readonly movement: Terminable
    private readonly reverse: Terminable

    constructor(readonly view: RotaryView, readonly element: HTMLElement, readonly model: RotaryTrackModel) {
        this.segments = this.terminator.with(new NumericStepper(element.querySelector("fieldset[data-parameter='segments']"),
            model.segments, PrintMapping.NoFloat, 1, ""))
        this.width = this.terminator.with(new NumericStepper(element.querySelector("fieldset[data-parameter='width']"),
            model.width, PrintMapping.NoFloat, 1, "px"))
        this.widthRatio = this.terminator.with(new NumericStepper(element.querySelector("fieldset[data-parameter='width-ratio']"),
            model.widthRatio, PrintMapping.UnipolarPercent, 0.01, "%"))
        this.length = this.terminator.with(new NumericStepper(element.querySelector("fieldset[data-parameter='length']"),
            model.length, PrintMapping.UnipolarPercent, 0.01, "%"))
        this.lengthRatio = this.terminator.with(new NumericStepper(element.querySelector("fieldset[data-parameter='length-ratio']"),
            model.lengthRatio, PrintMapping.UnipolarPercent, 0.01, "%"))
        this.phase = this.terminator.with(new NumericStepper(element.querySelector("fieldset[data-parameter='phase']"),
            model.phase, PrintMapping.UnipolarPercent, 0.01, "%"))
        this.fill = this.terminator.with(Dom.configEnumSelect(element.querySelector("select[data-parameter='fill']"),
            Fills, model.fill))
        this.movement = this.terminator.with(Dom.configEnumSelect(element.querySelector("select[data-parameter='movement']"),
            Movements, model.movement))
        this.reverse = this.terminator.with(Dom.configCheckbox(element.querySelector("input[data-parameter='reverse']"), model.reverse))

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
        const thickness = Math.max(width * this.model.widthRatio.get(), 1.0) * 0.5
        const radiusAverage = radiusMin + width * 0.5;
        const r0 = radiusAverage - thickness
        const r1 = radiusAverage + thickness
        for (let i = 0; i < segments; i++) {
            const angleMin = i * scale + phase
            const angleMax = angleMin + scale * this.model.lengthRatio.get()
            this.drawSection(context, r0, r1, angleMin, angleMax, this.model.fill.get())
        }
    }

    drawSection(context: CanvasRenderingContext2D, radiusMin: number, radiusMax: number, angleMin: number, angleMax: number, fill: Fill = Fill.Flat) {
        console.assert(radiusMin < radiusMax, `radiusMax(${radiusMax}) must be greater then radiusMin(${radiusMin})`)
        console.assert(angleMin < angleMax, `angleMax(${angleMax}) must be greater then angleMin(${angleMin})`)
        const radianMin = angleMin * TAU
        const radianMax = angleMax * TAU
        if (fill === Fill.Flat) {
            context.fillStyle = RotaryTrackView.WHITE
        } else if (fill === Fill.Stroke) {
            context.strokeStyle = RotaryTrackView.WHITE
        } else {
            const gradient: CanvasGradient = context.createConicGradient(radianMin, 0.0, 0.0)
            const offset = Math.min(angleMax - angleMin, 1.0)
            if (fill === Fill.Positive) {
                gradient.addColorStop(0.0, RotaryTrackView.TRANSPARENT)
                gradient.addColorStop(offset, RotaryTrackView.WHITE)
                gradient.addColorStop(offset, RotaryTrackView.TRANSPARENT) // eliminates tiny glitches at the end of the tail
            } else if (fill === Fill.Negative) {
                gradient.addColorStop(0.0, RotaryTrackView.WHITE)
                gradient.addColorStop(offset, RotaryTrackView.TRANSPARENT)
            }
            context.fillStyle = gradient
        }
        context.beginPath()
        context.arc(0.0, 0.0, radiusMax, radianMin, radianMax, false)
        context.arc(0.0, 0.0, radiusMin, radianMax, radianMin, true)
        context.closePath()
        if (fill === Fill.Stroke) {
            context.stroke()
        } else {
            context.fill()
        }
    }

    terminate() {
        this.terminator.terminate()
    }
}