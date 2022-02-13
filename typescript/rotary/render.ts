import {TAU} from "../lib/math.js"
import {RotaryModel} from "./model/rotary.js"
import {Fill, RotaryTrackModel, Segment} from "./model/track.js"

export interface RenderConfiguration {
    fps: number
    subFrames: number // motion blur off(1), on(2-32)
    numFrames: number
    size: number
}

export class RotaryRenderer {
    static render(context: CanvasRenderingContext2D,
                  model: RotaryModel,
                  phase: number,
                  alphaMultiplier: number = 1.0): void {
        let radiusMin = model.radiusMin.get()
        for (let i = 0; i < model.tracks.size(); i++) {
            const trackModel = model.tracks.get(i)
            RotaryRenderer.renderTrack(context, trackModel, radiusMin, trackModel.globalToLocal(phase), alphaMultiplier, true)
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
                               alphaMultiplier: number = 1.0,
                               highlightCrossing: boolean = false): void {
        const crossing: Segment = trackModel.localToSegment(phase)
        const segments = trackModel.segments.get()
        const length = trackModel.length.get()
        const width = trackModel.width.get()
        const r0 = radiusStart
        const r1 = radiusStart + width
        const bend = trackModel.bend.get()
        const lengthRatio = trackModel.lengthRatio.get()
        phase = trackModel.root.phaseOffset.get() - phase
        let startIndex = 0
        while (trackModel.connect.getBit(startIndex)) { // ignore leading connected segments (will be connected with last segment)
            startIndex++
        }
        if (startIndex === segments) return // all segments connected > result is undefined > abort rendering
        for (let index = startIndex; index < segments; index++) {
            if (trackModel.exclude.getBit(index)) {
                while (trackModel.connect.getBit((index + 1) % segments)) index++ // exclude connected as well
                continue
            }
            if (highlightCrossing) {
                const inactiveAlpha = trackModel.root.inactiveAlpha.get()
                context.globalAlpha = alphaMultiplier * (null !== crossing && crossing.index === index % segments
                    ? inactiveAlpha + (1.0 - inactiveAlpha) * crossing.ratio
                    : inactiveAlpha)
            }
            const a0 = index / segments
            while (trackModel.connect.getBit((index + 1) % segments)) index++ // skip connected
            const a1 = (index + lengthRatio) / segments
            RotaryRenderer.renderSection(context, trackModel, r0, r1,
                phase + bend.fx(a0) * length,
                phase + bend.fxi(a1) * length
            )
        }
        const outline = trackModel.outline.get()
        if (0.0 < outline) {
            context.globalAlpha = trackModel.root.inactiveAlpha.get()
            context.strokeStyle = trackModel.opaque()
            context.lineWidth = outline
            const numArcs = length < 1.0 ? segments - 1 : segments
            for (let index = startIndex; index < numArcs; index++) {
                if (trackModel.connect.getBit(index)) continue
                if (trackModel.connect.getBit((index + 1) % segments)) continue
                if (trackModel.exclude.getBit(index)) continue
                if (trackModel.exclude.getBit((index + 1) % segments)) continue
                const a0 = (index + lengthRatio) / segments
                const a1 = (index + 1) / segments
                const startAngle = (phase + bend.fx(a0) * length) * TAU
                const endAngle = (phase + bend.fx(a1) * length) * TAU
                const radius = r0 + width * 0.5
                if ((endAngle - startAngle) * radius < 1.0) {
                    continue
                }
                context.beginPath()
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
        if ((angleMax - angleMin) * radiusMin * TAU < 1.0) {
            angleMax = (angleMin + 1.0 / (radiusMin * TAU))
        }
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
            if (fill === Fill.Gradient) {
                if (model.reverse.get()) {
                    gradient.addColorStop(0.0, model.transparent())
                    gradient.addColorStop(offset, model.opaque())
                    gradient.addColorStop(offset, model.transparent()) // eliminates tiny glitches at the end of the tail
                } else {
                    gradient.addColorStop(0.0, model.opaque())
                    gradient.addColorStop(offset, model.transparent())
                }
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
                              configuration: RenderConfiguration,
                              process: (context: CanvasRenderingContext2D) => void,
                              progress?: (progress: number) => void): Promise<void> {
        let count = 0 | 0
        return new Promise((resolve) => {
            const iterator: Generator<CanvasRenderingContext2D> = RotaryRenderer.renderFrame(model, configuration)
            const next = () => {
                const curr = iterator.next()
                if (curr.done) {
                    if (progress !== undefined) progress(1.0)
                    resolve()
                } else {
                    if (progress !== undefined) progress(count++ / configuration.numFrames)
                    process(curr.value)
                    requestAnimationFrame(next)
                }
            }
            requestAnimationFrame(next)
        })
    }

    static* renderFrame(model: RotaryModel, configuration: RenderConfiguration): Generator<CanvasRenderingContext2D> {
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d", {alpha: true})
        const size = configuration.size
        const numFrames = configuration.numFrames
        const subFrames = configuration.subFrames
        const scale: number = size / (model.measureRadius() + 2.0) * 0.5 // two pixel padding for strokes
        canvas.width = size
        canvas.height = size
        for (let i = 0; i < numFrames; i++) {
            context.clearRect(0, 0, size, size)
            context.save()
            context.translate(size >> 1, size >> 1)
            context.scale(scale, scale)
            const phase: number = i / numFrames
            const alphaMultiplier = 1.0 / subFrames
            const offset = 1.0 / (model.duration() * configuration.fps * subFrames)
            for (let i = 0; i < subFrames; i++) {
                RotaryRenderer.render(context, model, phase + offset * i, alphaMultiplier)
            }
            context.restore()
            yield context
        }
    }
}