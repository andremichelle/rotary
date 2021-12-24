import {Fill, Rotary, RotaryTrack} from "./model";
import {NumericStepper} from "../controls";
import {PrintMapping, TAU, Terminable, Terminator} from "../common";

export class RotaryView {
    static create(document: Document, rotary: Rotary): RotaryView {
        const tracksContainer = document.querySelector(".tracks")
        const trackTemplate = document.querySelector(".track")
        trackTemplate.remove()
        return new RotaryView(tracksContainer, trackTemplate, rotary)
    }

    // noinspection JSMismatchedCollectionQueryUpdate
    private readonly trackViews: RotaryTrackView[]

    constructor(private readonly tracksContainer: Element,
                private readonly trackTemplate: Element,
                private readonly rotary: Rotary) {
        new NumericStepper(document.querySelector("[data-parameter='start-radius']"), rotary.radiusMin, PrintMapping.NoFloat, 1, "px")

        this.trackViews = rotary.tracks.map(track => {
            const element = trackTemplate.cloneNode(true) as HTMLElement
            tracksContainer.appendChild(element)
            return new RotaryTrackView(element, track)
        })
    }

    draw(context: CanvasRenderingContext2D, position: number): void {
        let radiusMin = this.rotary.radiusMin.get()
        for (let i = 0; i < this.trackViews.length; i++) {
            const trackView = this.trackViews[i]
            trackView.draw(context, radiusMin, position)
            radiusMin += trackView.track.width.get()
        }
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

    constructor(readonly element: HTMLElement, readonly track: RotaryTrack) {
        this.segments = this.terminator.with(new NumericStepper(element.querySelector("fieldset[data-parameter='segments']"),
            track.segments, PrintMapping.NoFloat, 1, ""))
        this.width = this.terminator.with(new NumericStepper(element.querySelector("fieldset[data-parameter='width']"),
            track.width, PrintMapping.NoFloat, 1, "px"))
        this.widthRatio = this.terminator.with(new NumericStepper(element.querySelector("fieldset[data-parameter='width-ratio']"),
            track.widthRatio, PrintMapping.UnipolarPercent, 0.01, "%"))
        this.length = this.terminator.with(new NumericStepper(element.querySelector("fieldset[data-parameter='length']"),
            track.length, PrintMapping.UnipolarPercent, 0.01, "%"))
        this.lengthRatio = this.terminator.with(new NumericStepper(element.querySelector("fieldset[data-parameter='length-ratio']"),
            track.lengthRatio, PrintMapping.UnipolarPercent, 0.01, "%"))
        this.phase = this.terminator.with(new NumericStepper(element.querySelector("fieldset[data-parameter='phase']"),
            track.phase, PrintMapping.UnipolarPercent, 0.01, "%"))
    }

    draw(context: CanvasRenderingContext2D, radiusMin: number, position: number): void {
        const scale = this.track.length.get() / this.track.segments.get()
        const phase = position - Math.floor(position) //this.moveFunc(position - Math.floor(position)) * (this.reverse ? -1 : 1) + this.track.phase.get()
        const width = this.track.width.get()
        const thickness = Math.max(width * this.track.widthRatio.get(), 1.0) * 0.5
        const radiusAverage = radiusMin + width * 0.5;
        const r0 = radiusAverage - thickness
        const r1 = radiusAverage + thickness
        for (let i = 0; i < this.track.segments.get(); i++) {
            const angleMin = i * scale + phase
            const angleMax = angleMin + scale * this.track.lengthRatio.get()
            this.drawSection(context, r0, r1, angleMin, angleMax) // TODO Fill
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
            const offset = Math.min((angleMax - angleMin) % 1.0, 1.0)
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