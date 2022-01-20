import {TAU} from "../lib/common.js"
import {Func} from "../lib/math.js"
import {Fill, RotaryModel, RotaryTrackModel} from "./model.js"

export class RotaryRenderer {
    static render(context: CanvasRenderingContext2D,
                  model: RotaryModel,
                  position: number): void {
        let radiusMin = model.radiusMin.get()
        for (let i = 0; i < model.tracks.size(); i++) {
            const track = model.tracks.get(i)
            RotaryRenderer.renderTrack(context, track, radiusMin, position)
            radiusMin += track.width.get() + track.widthPadding.get()
        }
    }

    static renderTrack(context: CanvasRenderingContext2D,
                       model: RotaryTrackModel,
                       radiusMin: number,
                       position: number): void {
        const phase = model.translatePhase(position)
        const segments = model.segments.get()
        const length = model.length.get()
        const width = model.width.get()
        const r0 = radiusMin
        const r1 = radiusMin + width
        const bend = model.bend.get()
        const lengthRatio = model.lengthRatio.get()
        for (let i = 0; i < segments; i++) {
            const a0 = i / segments, a1 = a0 + lengthRatio / segments
            RotaryRenderer.renderSection(context, model, r0, r1,
                phase + Func.tx(a0, bend) * length,
                phase + Func.tx(a1, bend) * length
            )
        }
        const outline = model.outline.get()
        if (0.0 < outline) {
            context.strokeStyle = model.opaque()
            context.lineWidth = outline
            const numArcs = length < 1.0 ? segments - 1 : segments
            for (let i = 0; i < numArcs; i++) {
                context.beginPath()
                const a0 = (i + lengthRatio) / segments, a1 = (i + 1) / segments
                const startAngle = (phase + Func.tx(a0, bend) * length) * TAU
                const endAngle = (phase + Func.tx(a1, bend) * length) * TAU
                const radius = r0 + width * 0.5
                if ((endAngle - startAngle) * radius < 1.0) {
                    continue
                }
                context.arc(0, 0, radius, startAngle, endAngle, false)
                context.stroke()
            }
            context.lineWidth = 1.0
        }
    }

    static renderSection(context: CanvasRenderingContext2D,
                         model: RotaryTrackModel,
                         radiusMin: number, radiusMax: number,
                         angleMin: number, angleMax: number): void {
        console.assert(radiusMin < radiusMax, `radiusMax(${radiusMax}) must be greater then radiusMin(${radiusMin})`)
        console.assert(angleMin <= angleMax, `angleMax(${angleMax}) must be greater then angleMin(${angleMin})`)
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

    static async renderFrames(model: RotaryModel,
                              numFrames: number,
                              size: number,
                              process: (context: CanvasRenderingContext2D) => void,
                              progress?: (progress: number) => void): Promise<void> {
        let count = 0 | 0
        return new Promise((resolve) => {
            const iterator: Generator<CanvasRenderingContext2D> = RotaryRenderer.renderFrame(model, numFrames, size)
            const next = () => {
                const curr = iterator.next()
                if (curr.done) {
                    if (progress !== undefined) progress(1.0)
                    resolve()
                } else {
                    if (progress !== undefined) progress(count++ / numFrames)
                    process(curr.value)
                    requestAnimationFrame(next)
                }
            }
            requestAnimationFrame(next)
        })
    }

    static* renderFrame(model: RotaryModel, numFrames: number, size: number): Generator<CanvasRenderingContext2D> {
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d", {alpha: true})
        const scale: number = size / (model.measureRadius() + 2.0) * 0.5 // two pixel padding for strokes
        canvas.width = size
        canvas.height = size
        for (let i = 0; i < numFrames; i++) {
            context.clearRect(0, 0, size, size)
            context.save()
            context.translate(size >> 1, size >> 1)
            context.scale(scale, scale)
            RotaryRenderer.render(context, model, i / numFrames)
            context.restore()
            yield context
        }
    }
}