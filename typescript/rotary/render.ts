import {Fill, RotaryModel, RotaryTrackModel} from "./model"
import {TAU} from "../lib/common"

export class RotaryRenderer {
    static draw(context: CanvasRenderingContext2D,
                rotary: RotaryModel,
                position: number): void {
        let radiusMin = rotary.radiusMin.get()
        for (let i = 0; i < rotary.tracks.size(); i++) {
            const model = rotary.tracks.get(i)
            RotaryRenderer.drawTrack(context, model, radiusMin, position)
            radiusMin += model.width.get() + model.widthPadding.get()
        }
    }

    static drawTrack(context: CanvasRenderingContext2D,
                     model: RotaryTrackModel,
                     radiusMin: number,
                     position: number): void {
        const segments = model.segments.get()
        const scale = model.length.get() / segments
        const phase = model.movement.get()(position - Math.floor(position)) * (model.reverse.get() ? -1 : 1) + model.phase.get()
        const width = model.width.get()
        const thickness = model.widthPadding.get() * 0.5
        const r0 = radiusMin + thickness
        const r1 = radiusMin + thickness + width
        for (let i = 0; i < segments; i++) {
            const angleMin = i * scale + phase
            const angleMax = angleMin + scale * model.lengthRatio.get()
            RotaryRenderer.drawSection(context, model, r0, r1, angleMin, angleMax, model.fill.get())
        }
    }

    static drawSection(context: CanvasRenderingContext2D,
                       model: RotaryTrackModel,
                       radiusMin: number, radiusMax: number,
                       angleMin: number, angleMax: number,
                       fill: Fill = Fill.Flat) {
        console.assert(radiusMin < radiusMax, `radiusMax(${radiusMax}) must be greater then radiusMin(${radiusMin})`)
        console.assert(angleMin < angleMax, `angleMax(${angleMax}) must be greater then angleMin(${angleMin})`)
        const radianMin = angleMin * TAU
        const radianMax = angleMax * TAU
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
}