import {TAU} from "../lib/common.js"
import {Func} from "../lib/math.js"
import {Fill, RotaryModel, RotaryTrackModel} from "./model.js"

export class RotaryRenderer {
    static render(context: CanvasRenderingContext2D,
                  model: RotaryModel,
                  phase: number): void {
        let radiusMin = model.radiusMin.get()
        for (let i = 0; i < model.tracks.size(); i++) {
            const trackModel = model.tracks.get(i)
            RotaryRenderer.renderTrack(context, trackModel, radiusMin, trackModel.globalToLocal(phase), true)
            radiusMin += trackModel.width.get() + trackModel.widthPadding.get()
        }
    }

    static renderTrackPreview(context: CanvasRenderingContext2D,
                              trackModel: RotaryTrackModel,
                              size: number): void {
        context.save()
        context.translate(size >> 1, size >> 1)
        const radius = 32.0 + trackModel.width.get()
        const scale: number = size / (radius + 2.0) * 0.5 // two pixel padding for strokes
        context.scale(scale, scale)
        RotaryRenderer.renderTrack(context, trackModel, 32.0, 0.0)
        context.restore()
    }

    private static renderTrack(context: CanvasRenderingContext2D,
                               trackModel: RotaryTrackModel,
                               radiusStart: number,
                               phase: number,
                               highlightCrossing: boolean = false): void {
        const crossingIndex = trackModel.localToSegment(phase)
        const segments = trackModel.segments.get()
        const length = trackModel.length.get()
        const width = trackModel.width.get()
        const r0 = radiusStart
        const r1 = radiusStart + width
        const bend = trackModel.bend.get()
        const lengthRatio = trackModel.lengthRatio.get()
        phase = trackModel.root.phaseOffset.get() - phase
        for (let index = 0; index < segments; index++) {
            if (highlightCrossing) {
                context.globalAlpha = index === Math.floor(crossingIndex) ? 0.4 + 0.6 /** (crossingIndex - Math.floor(crossingIndex))*/ : 0.4
            }
            const a0 = index / segments, a1 = a0 + lengthRatio / segments
            RotaryRenderer.renderSection(context, trackModel, r0, r1,
                phase + Func.tx(a0, bend) * length,
                phase + Func.tx(a1, bend) * length
            )
        }
        const outline = trackModel.outline.get()
        if (0.0 < outline) {
            context.strokeStyle = trackModel.opaque()
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

    private static renderSection(context: CanvasRenderingContext2D,
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