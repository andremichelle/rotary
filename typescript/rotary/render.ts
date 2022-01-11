import {TAU} from "../lib/common.js"
import {Function} from "../lib/math.js"
import {Fill, RotaryModel, RotaryTrackModel} from "./model.js"

export class RotaryRenderer {
    static renderTrack(context: CanvasRenderingContext2D,
                       model: RotaryTrackModel,
                       radiusMin: number,
                       position: number): void {
        const phase = model.map(position)
        const segments = model.segments.get()
        const scale = model.length.get() / segments
        const width = model.width.get()
        const thickness = model.widthPadding.get() * 0.5
        const r0 = radiusMin + thickness
        const r1 = radiusMin + thickness + width
        const bend = model.bend.get()
        for (let i = 0; i < segments; i++) {
            const angleMin = i * scale
            const angleMax = angleMin + scale * model.lengthRatio.get()
            RotaryRenderer.renderSection(context, model, r0, r1,
                phase + Function.tx(angleMin, bend),
                phase + Function.tx(angleMax, bend)
            )
        }

        /*const radius = model.root.radiusMin.get() * 0.8 // 80% debug circle
        this.context.fillStyle = "white"
        this.context.strokeStyle = "white"
        this.context.beginPath()
        this.context.arc(0, 0, radius, 0, TAU, false)
        this.context.stroke()
        this.context.beginPath()
        this.context.arc(0, 0, radius * model.ratio(position), 0, TAU, false)
        this.context.fill()*/
    }

    static renderSection(context: CanvasRenderingContext2D,
                         model: RotaryTrackModel,
                         radiusMin: number, radiusMax: number,
                         angleMin: number, angleMax: number): void {
        console.assert(radiusMin < radiusMax, `radiusMax(${radiusMax}) must be greater then radiusMin(${radiusMin})`)
        console.assert(angleMin < angleMax, `angleMax(${angleMax}) must be greater then angleMin(${angleMin})`)
        const radianMin = angleMin * TAU
        const radianMax = angleMax * TAU
        const fill = model.fill.get()
        if (fill === Fill.Flat) {
            context.fillStyle = model.opaque()
        } else if (fill === Fill.Stroke || fill === Fill.Line) {
            context.strokeStyle = model.opaque()
        } else {
            const gradient: CanvasGradient = context.createConicGradient(radianMin, 0.0, 0.0)
            const offset = Math.min(angleMax - angleMin, 1.0)
            if (fill === Fill.Positive) {
                gradient.addColorStop(0.0, model.transparent())
                gradient.addColorStop(offset, model.opaque())
                gradient.addColorStop(offset, model.transparent()) // eliminates tiny glitches at the end of the tail
            } else if (fill === Fill.Negative) {
                gradient.addColorStop(0.0, model.opaque())
                gradient.addColorStop(offset, model.transparent())
            }
            context.fillStyle = gradient
        }
        if (fill === Fill.Line) {
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

    private highlight: RotaryTrackModel = null

    constructor(private readonly context: CanvasRenderingContext2D,
                private readonly model: RotaryModel) {
    }

    draw(position: number): void {
        let radiusMin = this.model.radiusMin.get()
        for (let i = 0; i < this.model.tracks.size(); i++) {
            const model = this.model.tracks.get(i)
            this.context.globalAlpha = model === this.highlight || null === this.highlight ? 1.0 : 0.4
            RotaryRenderer.renderTrack(this.context, model, radiusMin, position)
            radiusMin += model.width.get() + model.widthPadding.get()
        }
    }

    showHighlight(model: RotaryTrackModel) {
        this.highlight = model
    }

    releaseHighlight() {
        this.highlight = null
    }
}