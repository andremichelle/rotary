import {
    BoundNumericValue,
    Iterator,
    Observable,
    ObservableCollection,
    ObservableValueImpl,
    Observer,
    Serializer,
    Terminable,
    Terminator
} from "../lib/common.js"
import {Func, Random} from "../lib/math.js"
import {Linear, LinearInteger} from "../lib/mapping.js"
import {
    CShapeMotion,
    LinearMotion,
    Motion,
    MotionFormat,
    MotionType,
    PowMotion,
    SmoothStepMotion,
    TShapeMotion
} from "./motion.js"
import {Colors} from "../lib/colors.js"

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
    outline: number
    fill: number
    rgb: number
    motion: MotionFormat<any>
    phaseOffset: number
    bend: number
    frequency: number
    reverse: boolean
}

export class RotaryModel implements Serializer<RotaryFormat>, Terminable {
    static MAX_TRACKS = 24

    private readonly terminator: Terminator = new Terminator()
    readonly tracks: ObservableCollection<RotaryTrackModel> = new ObservableCollection()
    readonly radiusMin = this.terminator.with(new BoundNumericValue(new LinearInteger(0, 1024), 20))
    readonly exportSize = this.terminator.with(new BoundNumericValue(new LinearInteger(128, 1024), 256))
    readonly phaseOffset = this.terminator.with(new BoundNumericValue(Linear.Identity, 0.00))
    readonly loopDuration = this.terminator.with(new BoundNumericValue(new Linear(1.0, 16.0), 8.0))

    constructor() {
    }

    randomize(random: Random): RotaryModel {
        this.radiusMin.set(20)
        this.tracks.clear()
        const palette = Colors.getRandomPalette(random)
        let radius = this.radiusMin.get()
        while (radius < 256) {
            const track = this.createTrack().randomize(random)
            track.rgb.set(palette[Math.floor(random.nextDouble(0.0, palette.length))])
            radius += track.width.get() + track.widthPadding.get()
        }
        return this
    }

    randomizeTracks(random: Random): RotaryModel {
        this.tracks.forEach(track => track.randomize(random))
        return this
    }

    randomizePalette(random: Random): RotaryModel {
        const palette = Colors.getRandomPalette(random)
        this.tracks.forEach(track => track.rgb.set(palette[Math.floor(random.nextDouble(0.0, palette.length))]))
        return this
    }

    // noinspection JSUnusedGlobalSymbols
    test(): RotaryModel {
        this.tracks.clear()
        this.radiusMin.set(256)
        this.createTrack().test()
        return this
    }

    createTrack(index: number = Number.MAX_SAFE_INTEGER): RotaryTrackModel | null {
        const track = new RotaryTrackModel(this)
        return this.tracks.add(track, index) ? track : null
    }

    copyTrack(source: RotaryTrackModel, insertIndex: number = Number.MAX_SAFE_INTEGER): RotaryTrackModel {
        const copy = this.createTrack(insertIndex)
        copy.segments.set(source.segments.get())
        copy.fill.set(source.fill.get())
        copy.rgb.set(source.rgb.get())
        copy.length.set(source.length.get())
        copy.lengthRatio.set(source.lengthRatio.get())
        copy.outline.set(source.outline.get())
        copy.width.set(source.width.get())
        copy.widthPadding.set(source.widthPadding.get())
        copy.motion.set(source.motion.get().copy())
        copy.reverse.set(source.reverse.get())
        copy.bend.set(source.bend.get())
        copy.phaseOffset.set(source.phaseOffset.get())
        copy.frequency.set(source.frequency.get())
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
            const model = new RotaryTrackModel(this)
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
    ["TShape", TShapeMotion],
    ["SmoothStep", SmoothStepMotion]
])

export const Fills = new Map<string, Fill>(
    [["Flat", Fill.Flat], ["Stroke", Fill.Stroke], ["Line", Fill.Line], ["Gradient+", Fill.Positive], ["Gradient-", Fill.Negative]])

export enum Edge {
    Min, Max
}

export class FilterResult {
    // noinspection JSUnusedGlobalSymbols
    constructor(readonly edge: Edge, readonly index: number, readonly position: number) {
    }
}

export class RotaryTrackModel implements Observable<RotaryTrackModel>, Serializer<RotaryTrackFormat>, Terminable {
    private readonly terminator: Terminator = new Terminator()
    readonly segments = this.terminator.with(new BoundNumericValue(new LinearInteger(1, 1024), 8))
    readonly width = this.terminator.with(new BoundNumericValue(new LinearInteger(1, 1024), 12))
    readonly widthPadding = this.terminator.with(new BoundNumericValue(new LinearInteger(0, 1024), 0))
    readonly length = this.terminator.with(new BoundNumericValue(Linear.Identity, 1.0))
    readonly lengthRatio = this.terminator.with(new BoundNumericValue(Linear.Identity, 0.5))
    readonly outline = this.terminator.with(new BoundNumericValue(new LinearInteger(0, 16), 0))
    readonly fill = this.terminator.with(new ObservableValueImpl<Fill>(Fill.Flat))
    readonly rgb = this.terminator.with(new ObservableValueImpl(<number>(0xFFFFFF)))
    readonly motion = this.terminator.with(new ObservableValueImpl<Motion<any>>(new LinearMotion()))
    readonly phaseOffset = this.terminator.with(new BoundNumericValue(Linear.Identity, 0.0))
    readonly bend = this.terminator.with(new BoundNumericValue(Linear.Bipolar, 0.0))
    readonly frequency = this.terminator.with(new BoundNumericValue(new LinearInteger(1, 16), 1.0))
    readonly reverse = this.terminator.with(new ObservableValueImpl<boolean>(false))
    private readonly gradient: string[] = [] // opaque[0], transparent[1]
    private readonly observers: Map<Observer<RotaryTrackModel>, Terminable> = new Map()

    constructor(readonly root: RotaryModel) {
        this.terminator.with(this.rgb.addObserver(() => this.updateGradient()))
        this.updateGradient()
    }

    addObserver(observer: Observer<RotaryTrackModel>): Terminable {
        const mappedObserver: () => void = () => observer(this)
        const terminator = new Terminator()
        terminator.with(this.segments.addObserver(mappedObserver))
        terminator.with(this.phaseOffset.addObserver(mappedObserver))
        terminator.with(this.bend.addObserver(mappedObserver))
        terminator.with(this.frequency.addObserver(mappedObserver))
        terminator.with(this.reverse.addObserver(mappedObserver))
        terminator.with(this.length.addObserver(mappedObserver))
        terminator.with(this.lengthRatio.addObserver(mappedObserver))
        terminator.with(this.outline.addObserver(mappedObserver))
        terminator.with(this.motion.addObserver(mappedObserver))
        terminator.with(this.width.addObserver(mappedObserver))
        terminator.with(this.widthPadding.addObserver(mappedObserver))
        terminator.with(this.rgb.addObserver(mappedObserver))
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

    // TODO deprecated
    ratio(phase: number): number {
        const intersection: number = 0.75 // top
        phase = intersection - this.translatePhase(phase)
        phase -= Math.floor(phase)
        phase = Func.tx(phase, -this.bend.get())
        phase /= this.length.get()
        if (phase >= 1.0) return 0.0
        phase %= 1.0 / this.segments.get()
        phase *= this.segments.get()
        phase /= this.lengthRatio.get()
        if (phase > 1.0) return 0.0
        phase = 1.0 - phase
        return phase
    }

    // TODO deprecated
    index(phase: number): number {
        const intersection: number = 0.75 // top
        phase = intersection - this.translatePhase(phase)
        phase = Func.tx(phase - Math.floor(phase), -this.bend.get())
        const length = this.length.get()
        if (phase >= length) return 0.0
        return Math.floor(phase / length * this.segments.get())
    }

    test() {
        this.phaseOffset.set(0.0)
        this.bend.set(-0.1)
        this.frequency.set(1.0)
        this.reverse.set(false)
        this.length.set(1.0)
        this.lengthRatio.set(0.125)
        this.outline.set(1.0)
        this.segments.set(32)
        // this.motion.set(new LinearMotion())
        const shapeMotion = new TShapeMotion()
        shapeMotion.shape.set(0.1)
        this.motion.set(shapeMotion)
        this.width.set(128)
        this.fill.set(Fill.Stroke)
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
        const width = random.nextDouble(0.0, 1.0) < 0.2 ? random.nextDouble(0.0, 1.0) < 0.2 ? 32.0 : 24.0 : 12.0
        const widthPadding = random.nextDouble(0.0, 1.0) < 0.25 ? random.nextDouble(0.0, 1.0) < 0.25 ? 0.0 : 6.0 : 12.0
        const length = random.nextDouble(0.0, 1.0) < 0.1 ? 0.75 : 1.0
        const fill = 4 >= segments && random.nextDouble(0.0, 1.0) < 0.4 ? Fill.Positive : random.nextDouble(0.0, 1.0) < 0.2 ? Fill.Stroke : Fill.Flat
        this.segments.set(0 === lengthRatioExp ? 1 : segments)
        this.width.set(width)
        this.widthPadding.set(widthPadding)
        this.length.set(length)
        this.lengthRatio.set(lengthRatio)
        this.outline.set(fill == Fill.Stroke || fill === Fill.Flat && random.nextBoolean() ? 1 : 0)
        this.fill.set(fill)
        this.motion.set(Motion.random(random))
        this.phaseOffset.set(Math.floor(random.nextDouble(0.0, 4.0)) * 0.25)
        this.bend.set(random.nextDouble(-.5, .5))
        this.frequency.set(Math.floor(random.nextDouble(1.0, 3.0)))
        this.reverse.set(random.nextBoolean())
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
            outline: this.outline.get(),
            fill: this.fill.get(),
            rgb: this.rgb.get(),
            motion: this.motion.get().serialize(),
            phaseOffset: this.phaseOffset.get(),
            bend: this.bend.get(),
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
        this.outline.set(format.outline)
        this.fill.set(format.fill)
        this.rgb.set(format.rgb)
        this.motion.set(Motion.from(format.motion))
        this.phaseOffset.set(format.phaseOffset)
        this.bend.set(format.bend)
        this.frequency.set(format.frequency)
        this.reverse.set(format.reverse)
        return this
    }

    translatePhase(x: number): number {
        x = Func.switchSign(this.phaseOffset.get() + (this.root.phaseOffset.get() - x) * this.frequency.get(), this.reverse.get())
        x = this.motion.get().map(x - Math.floor(x))
        return x - Math.floor(x)
    }

    filterSections(p0: number, p1: number, offset: number): Iterator<FilterResult> {
        if (p0 >= p1) {
            throw new Error(`p1(${p1}) must be greater than p0(${p0})`)
        }
        const delta = this.translatePhase(offset)
        // console.log(`filterSections p0: ${p0}, p1: ${p1}, offset: ${offset}, delta: ${delta}`)
        p0 -= delta
        p1 -= delta
        const pi = Math.floor(p0)
        p0 -= pi
        p1 -= pi
        return Iterator.wrap(this.branchFilterSection(p0, p1, delta + pi))
    }

    private* branchFilterSection(p0: number, p1: number, delta: number): Generator<FilterResult, void, FilterResult> {
        console.assert(p0 >= 0.0 && p0 < 1.0, `p0(${p0}) must be positive and smaller than 1.0`)
        console.assert(p1 < 2.0, `p1(${p1}) must be smaller than 2.0`)
        // console.log(`branchFilterSection p0: ${p0}, p1: ${p1}, delta: ${delta}`)
        if (p1 > 1.0) {
            yield* this.seekSection(1, p0, 1.0, delta)
            yield* this.seekSection(2, 0.0, p1 - 1.0, delta + 1.0)
        } else {
            yield* this.seekSection(3, p0, p1, delta)
        }
    }

    private* seekSection(branch: number, p0: number, p1: number, delta: number): Generator<FilterResult> {
        // console.log(`seekSection #${branch} p0: ${p0}, p1: ${p1}, delta: ${delta}`)
        if (p0 >= p1) {
            // return
        }
        console.assert(0.0 <= p0 && p0 <= 1.0, `x0: ${p0} out of bounds in branch ${branch}`)
        console.assert(0.0 <= p1 && p1 <= 1.0, `x1: ${p1} out of bounds in branch ${branch}`)
        const bend = this.bend.get()
        const length = this.length.get()
        const lengthRatio = this.lengthRatio.get()
        const segments = this.segments.get()
        const step: number = length / segments
        const t0 = Func.tx(Func.clamp(p0 / length), -bend) * length
        const t1 = Func.tx(Func.clamp(p1 / length), -bend) * length
        let index = Math.floor(t0 / step)
        let seekMin = index * step
        let seekMax = (index + lengthRatio) * step
        while (seekMin < t1) {
            if (seekMin >= t0) {
                const position = Func.tx(seekMin / length, bend) * length + delta
                //console.log(`found <${branch}> p0: ${p0}, p1: ${p1}, delta: ${delta} > ${position} #${index}`)
                yield new FilterResult(Edge.Min, index, position)
            }
            if (seekMax >= t0 && seekMax < t1) {
                const position = Func.tx(seekMax / length, bend) * length + delta
                yield new FilterResult(Edge.Max, index, position)
            }
            seekMin = ++index * step
            seekMax = (index + lengthRatio) * step
        }
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