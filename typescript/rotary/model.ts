import {
    BoundNumericValue,
    ObservableCollection,
    ObservableValueImpl,
    Serializer,
    Terminable,
    Terminator
} from "../lib/common"
import {Random} from "../lib/math"
import {Linear, LinearInteger} from "../lib/mapping"
import {CShapeMotion, LinearMotion, Motion, MotionFormat, MotionType, PowMotion, SmoothStepMotion} from "./motion"

declare interface RotaryFormat {
    radiusMin: number
    tracks: RotaryTrackFormat[]
}

declare interface RotaryTrackFormat {
    segments: number
    width: number
    widthPadding: number
    length: number
    lengthRatio: number
    fill: number
    rgb: number
    motion: MotionFormat<any>
    phaseOffset: number
    frequency: number
    reverse: boolean
}

export class RotaryModel implements Serializer<RotaryFormat>, Terminable {
    private readonly terminator: Terminator = new Terminator()
    readonly tracks: ObservableCollection<RotaryTrackModel> = new ObservableCollection()
    readonly radiusMin = this.terminator.with(new BoundNumericValue(new LinearInteger(0, 1024), 20))

    constructor() {
    }

    randomize(random: Random): RotaryModel {
        const tracks = []
        for (let i = 0; i < 12; i++) {
            tracks.push(new RotaryTrackModel().randomize(random))
        }
        this.tracks.clear()
        this.tracks.addAll(tracks)
        return this
    }

    // noinspection JSUnusedGlobalSymbols
    test(): RotaryModel {
        const trackModel = new RotaryTrackModel()
        trackModel.motion.set(new LinearMotion())

        this.tracks.clear()
        this.tracks.add(trackModel)
        return this
    }

    createTrack(index: number = Number.MAX_SAFE_INTEGER): RotaryTrackModel | null {
        const track = new RotaryTrackModel()
        return this.tracks.add(track, index) ? track : null
    }

    copyTrack(source: RotaryTrackModel, insertIndex: number = Number.MAX_SAFE_INTEGER): RotaryTrackModel {
        const copy = this.createTrack(insertIndex)
        copy.segments.set(source.segments.get())
        copy.fill.set(source.fill.get())
        copy.rgb.set(source.rgb.get())
        copy.length.set(source.length.get())
        copy.lengthRatio.set(source.lengthRatio.get())
        copy.width.set(source.width.get())
        copy.widthPadding.set(source.widthPadding.get())
        copy.motion.set(source.motion.get())
        return copy
    }

    removeTrack(track: RotaryTrackModel): boolean {
        return this.tracks.remove(track)
    }

    clear() {
        this.radiusMin.set(20.0)
        this.tracks.clear()
    }

    measureRadius(): number {
        return this.tracks.reduce((radius, track) =>
            radius + track.width.get() + track.widthPadding.get(), this.radiusMin.get())
    }

    terminate(): void {
        this.terminator.terminate()
    }

    serialize(): RotaryFormat {
        return {
            radiusMin: this.radiusMin.get(),
            tracks: this.tracks.map(track => track.serialize())
        }
    }

    deserialize(format: RotaryFormat): RotaryModel {
        this.radiusMin.set(format['radiusMin'])

        this.tracks.clear()
        this.tracks.addAll(format.tracks.map(trackFormat => {
            const model = new RotaryTrackModel()
            model.deserialize(trackFormat)
            return model
        }))
        return this
    }
}

export enum Fill {
    Flat, Stroke, Line, Positive, Negative
}

export const MotionTypes = new Map<string, MotionType>([
    ["Linear", LinearMotion],
    ["Power", PowMotion],
    ["CShape", CShapeMotion],
    ["SmoothStep", SmoothStepMotion]
])

export const Fills = new Map<string, Fill>(
    [["Flat", Fill.Flat], ["Stroke", Fill.Stroke], ["Line", Fill.Line], ["Gradient+", Fill.Positive], ["Gradient-", Fill.Negative]])

export class RotaryTrackModel implements Serializer<RotaryTrackFormat>, Terminable {
    private readonly terminator: Terminator = new Terminator()
    readonly segments = this.terminator.with(new BoundNumericValue(new LinearInteger(1, 1024), 8))
    readonly width = this.terminator.with(new BoundNumericValue(new LinearInteger(1, 1024), 12))
    readonly widthPadding = this.terminator.with(new BoundNumericValue(new LinearInteger(0, 1024), 0))
    readonly length = this.terminator.with(new BoundNumericValue(Linear.Identity, 1.0))
    readonly lengthRatio = this.terminator.with(new BoundNumericValue(Linear.Identity, 0.5))
    readonly fill = this.terminator.with(new ObservableValueImpl<Fill>(Fill.Flat))
    readonly rgb = this.terminator.with(new ObservableValueImpl(<number>(0xFFFFFF)))
    readonly motion = this.terminator.with(new ObservableValueImpl<Motion<any>>(new LinearMotion()))
    readonly phaseOffset = this.terminator.with(new BoundNumericValue(Linear.Identity, 0.0))
    readonly frequency = this.terminator.with(new BoundNumericValue(new LinearInteger(1, 16), 1.0))
    readonly reverse = this.terminator.with(new ObservableValueImpl<boolean>(false))
    private readonly gradient: string[] = [] // opaque[0], transparent[1]

    constructor() {
        this.terminator.with(this.rgb.addObserver(() => this.updateGradient()))
        this.updateGradient()
    }

    map(phase: number): number {
        const x = this.phaseOffset.get() + (phase - Math.floor(phase)) * (this.reverse.get() ? -1.0 : 1.0) * this.frequency.get()
        return this.motion.get().map(x - Math.floor(x))
    }

    opaque(): string {
        return this.gradient[0]
    }

    transparent(): string {
        return this.gradient[1]
    }

    randomize(random: Random): RotaryTrackModel {
        const segments = 1 + Math.floor(random.nextDouble(0.0, 9.0))
        const lengthRatioExp = -Math.floor(random.nextDouble(0.0, 3.0))
        const lengthRatio = 0 === lengthRatioExp ? 0.5 : random.nextDouble(0.0, 1.0) < 0.5 ? 1.0 - Math.pow(2.0, lengthRatioExp) : Math.pow(2.0, lengthRatioExp)
        const width = random.nextDouble(0.0, 1.0) < 0.1 ? 24.0 : 12.0
        const widthPadding = random.nextDouble(0.0, 1.0) < 0.5 ? 0.0 : 3.0
        const length = random.nextDouble(0.0, 1.0) < 0.1 ? 0.75 : 1.0
        const fill = 2 === segments ? Fill.Positive : random.nextDouble(0.0, 1.0) < 0.2 ? Fill.Stroke : Fill.Flat
        this.segments.set(0 === lengthRatioExp ? 1 : segments)
        this.width.set(width)
        this.widthPadding.set(widthPadding)
        this.length.set(length)
        this.lengthRatio.set(lengthRatio)
        this.fill.set(fill)
        this.motion.set(Motion.random(random))
        this.phaseOffset.set(random.nextDouble(0.0, 1.0))
        this.frequency.set(Math.floor(random.nextDouble(1.0, 4.0)))
        this.reverse.set(random.nextDouble(0.0, 1.0) < 0.5)
        return this
    }

    terminate(): void {
        this.terminator.terminate()
    }

    serialize(): RotaryTrackFormat {
        return {
            segments: this.segments.get(),
            width: this.width.get(),
            widthPadding: this.widthPadding.get(),
            length: this.length.get(),
            lengthRatio: this.lengthRatio.get(),
            fill: this.fill.get(),
            rgb: this.rgb.get(),
            motion: this.motion.get().serialize(),
            phaseOffset: this.phaseOffset.get(),
            frequency: this.frequency.get(),
            reverse: this.reverse.get()
        }
    }

    deserialize(format: RotaryTrackFormat): RotaryTrackModel {
        this.segments.set(format.segments)
        this.width.set(format.width)
        this.widthPadding.set(format.widthPadding)
        this.length.set(format.length)
        this.lengthRatio.set(format.lengthRatio)
        this.fill.set(format.fill)
        this.rgb.set(format.rgb)
        this.motion.set(Motion.from(format.motion))
        this.phaseOffset.set(format.phaseOffset)
        this.frequency.set(format.frequency)
        this.reverse.set(format.reverse)
        return this
    }

    private updateGradient(): void {
        const rgb = this.rgb.get()
        const r = (rgb >> 16) & 0xFF
        const g = (rgb >> 8) & 0xFF
        const b = rgb & 0xFF
        this.gradient[0] = `rgba(${r},${g},${b},1.0)`
        this.gradient[1] = `rgba(${r},${g},${b},0.0)`
    }
}