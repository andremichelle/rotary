import {
    BoundNumericValue,
    Observable,
    ObservableCollection,
    ObservableValueImpl,
    Observer,
    Serializer,
    Terminable,
    Terminator
} from "../lib/common.js"
import {Random} from "../lib/math.js"
import {Linear, LinearInteger} from "../lib/mapping.js"
import {CShapeMotion, LinearMotion, Motion, MotionFormat, MotionType, PowMotion, SmoothStepMotion} from "./motion.js"

export declare interface RotaryFormat {
    radiusMin: number
    tracks: RotaryTrackFormat[]
}

export declare interface RotaryTrackFormat {
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
        let radius = this.radiusMin.get()
        while (radius < 256) {
            const track = new RotaryTrackModel().randomize(random)
            tracks.push(track)
            radius += track.width.get() + track.widthPadding.get()
        }
        this.tracks.clear()
        this.tracks.addAll(tracks)
        return this
    }

    randomizeTracks(random: Random): RotaryModel {
        this.tracks.forEach(track => track.randomize(random))
        return this
    }

    // noinspection JSUnusedGlobalSymbols
    test(): RotaryModel {
        const trackModel = new RotaryTrackModel()
        trackModel.test()
        this.radiusMin.set(128)
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
        copy.motion.set(source.motion.get().copy())
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

export class RotaryTrackModel implements Observable<RotaryTrackModel>, Serializer<RotaryTrackFormat>, Terminable {
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
    private readonly observers: Map<Observer<RotaryTrackModel>, Terminable> = new Map()

    constructor() {
        this.terminator.with(this.rgb.addObserver(() => this.updateGradient()))
        this.updateGradient()
    }

    addObserver(observer: Observer<RotaryTrackModel>): Terminable {
        const mappedObserver: () => void = () => observer(this)
        const terminator = new Terminator()
        terminator.with(this.segments.addObserver(mappedObserver))
        terminator.with(this.phaseOffset.addObserver(mappedObserver))
        terminator.with(this.frequency.addObserver(mappedObserver))
        terminator.with(this.reverse.addObserver(mappedObserver))
        terminator.with(this.length.addObserver(mappedObserver))
        terminator.with(this.lengthRatio.addObserver(mappedObserver))
        terminator.with(this.motion.addObserver(mappedObserver))
        terminator.with(this.width.addObserver(mappedObserver))
        terminator.with(this.widthPadding.addObserver(mappedObserver))
        this.observers.set(observer, terminator)
        return {terminate: () => this.removeObserver(observer)}
    }

    removeObserver(observer: Observer<RotaryTrackModel>): boolean {
        const terminable = this.observers.get(observer)
        this.observers.delete(observer)
        if (undefined === terminable) return false
        terminable.terminate()
        return true
    }

    map(phase: number): number {
        phase += this.phaseOffset.get()
        phase -= Math.floor(phase)
        phase *= this.frequency.get()
        phase -= Math.floor(phase)
        phase = (this.reverse.get() ? 1.0 - phase : phase)
        phase -= Math.floor(phase)
        phase = this.motion.get().map(phase)
        return phase
    }

    ratio(phase: number): number {
        phase -= Math.floor(phase)
        phase = this.map(phase)
        phase -= Math.floor(phase)
        phase = 1.0 - phase
        phase /= this.length.get()
        if (phase >= 1.0) return 0.0
        phase %= 1.0 / this.segments.get()
        phase *= this.segments.get()
        phase /= this.lengthRatio.get()
        if (phase > 1.0) return 0.0
        phase = 1.0 - phase
        return phase
    }

    test() {
        this.phaseOffset.set(0.0)
        this.frequency.set(1.0)
        this.reverse.set(false)
        this.length.set(0.5)
        this.lengthRatio.set(0.5)
        this.segments.set(4)
        this.motion.set(new SmoothStepMotion())
        this.width.set(128)
    }

    opaque(): string {
        return this.gradient[0]
    }

    transparent(): string {
        return this.gradient[1]
    }

    randomize(random: Random): RotaryTrackModel {
        const segments = 1 + Math.floor(random.nextDouble(0.0, 9.0)) * 2
        const lengthRatioExp = -Math.floor(random.nextDouble(0.0, 3.0))
        const lengthRatio = 0 === lengthRatioExp ? 0.5 : random.nextDouble(0.0, 1.0) < 0.5 ? 1.0 - Math.pow(2.0, lengthRatioExp) : Math.pow(2.0, lengthRatioExp)
        const width = random.nextDouble(0.0, 1.0) < 0.2 ? 18.0 : 6.0
        const widthPadding = random.nextDouble(0.0, 1.0) < 0.25 ? 0.0 : 6.0
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