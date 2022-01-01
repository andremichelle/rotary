import {
    BoundNumericValue,
    ObservableCollection,
    ObservableValueImpl,
    Serializer,
    Terminable,
    Terminator,
    UniformRandomMapping
} from "../lib/common"
import {JsRandom, Random} from "../lib/math"
import {Linear, LinearInteger} from "../lib/mapping"

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
    movement: number
    reverse: boolean
    phase: number
}

export class RotaryModel implements Serializer<RotaryFormat>, Terminable {
    readonly tracks: ObservableCollection<RotaryTrackModel> = new ObservableCollection()
    private readonly terminator: Terminator = new Terminator()
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
        copy.phase.set(source.phase.get())
        copy.movement.set(source.movement.get())
        copy.reverse.set(source.reverse.get())
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

    deserialize(format: RotaryFormat): void {
        this.radiusMin.set(format['radiusMin'])

        this.tracks.clear()
        this.tracks.addAll(format.tracks.map(trackFormat => {
            const model = new RotaryTrackModel()
            model.deserialize(trackFormat)
            return model
        }))
    }
}

export enum Fill {
    Flat, Stroke, Line, Positive, Negative
}

const AccAndStop = exp => x => Math.pow(x, exp)
const OddShape = shape => { // https://www.desmos.com/calculator/bpbuua3l0j
    const o = Math.pow(2.0, shape)
    const c = Math.pow(2.0, o - 1)
    return x => c * Math.sign(x - 0.5) * Math.pow(Math.abs(x - 0.5), o) + 0.5
}
export type Move = (x: number) => number
const randomMapping = new UniformRandomMapping(JsRandom.Instance, 16, 64.0, 1.0)
export const Movements = new Map([
    ["Linear", x => x],
    ["Sine", x => Math.sin(x * Math.PI)],
    ["StopAndGo", x => 1.0 - Math.min(1.0, 2.0 * (2.0 * x - Math.floor(2.0 * x)))],
    ["AccAndStop 2", AccAndStop(2.0)],
    ["AccAndStop 3", AccAndStop(3.0)],
    ["OddShape -1", OddShape(-1.0)],
    ["OddShape 1", OddShape(1.0)],
    ["OddShape 2", OddShape(2.0)],
    ["Random", x => randomMapping.y(x)],
])
export const randomMovement = (random: Random): Move => {
    const array = Array.from(Movements)
    return array[Math.floor(random.nextDouble(0.0, 1.0) * array.length)][1]
}
export const Fills = new Map<string, Fill>(
    [["Flat", Fill.Flat], ["Stroke", Fill.Stroke], ["Line", Fill.Line], ["Gradient+", Fill.Positive], ["Gradient-", Fill.Negative]])

export class RotaryTrackModel implements Serializer<RotaryTrackFormat>, Terminable {
    private readonly terminator: Terminator = new Terminator()
    readonly segments = this.terminator.with(new BoundNumericValue(new LinearInteger(1, 1024), 8))
    readonly width = this.terminator.with(new BoundNumericValue(new LinearInteger(1, 1024), 12))
    readonly widthPadding = this.terminator.with(new BoundNumericValue(new LinearInteger(0, 1024), 0))
    readonly length = this.terminator.with(new BoundNumericValue(Linear.Identity, 1.0))
    readonly lengthRatio = this.terminator.with(new BoundNumericValue(Linear.Identity, 0.5))
    readonly phase = this.terminator.with(new BoundNumericValue(Linear.Identity, 0.0))
    readonly fill = this.terminator.with(new ObservableValueImpl<Fill>(Fill.Flat))
    readonly movement = this.terminator.with(new ObservableValueImpl<Move>(Movements.values().next().value))
    readonly reverse = this.terminator.with(new ObservableValueImpl<boolean>(false))
    readonly rgb = this.terminator.with(new ObservableValueImpl(<number>(0xFFFFFF)))
    private readonly gradient: string[] = [] // opaque[0], transparent[1]

    constructor() {
        this.terminator.with(this.rgb.addObserver(() => this.updateGradient()))
        this.updateGradient()
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
        const widthPadding = random.nextDouble(0.0, 1.0) < 0.1 ? 0.0 : 3.0
        const length = random.nextDouble(0.0, 1.0) < 0.1 ? 0.75 : 1.0
        const fill = 2 === segments ? Fill.Positive : random.nextDouble(0.0, 1.0) < 0.2 ? Fill.Stroke : Fill.Flat
        this.segments.set(0 === lengthRatioExp ? 1 : segments)
        this.width.set(width)
        this.widthPadding.set(widthPadding)
        this.length.set(length)
        this.lengthRatio.set(lengthRatio)
        this.fill.set(fill)
        this.movement.set(randomMovement(random))
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
            movement: /*this.movement.get()*/ 0, // TODO
            reverse: this.reverse.get(),
            phase: this.phase.get()
        }
    }

    deserialize(format: RotaryTrackFormat): void {
        this.segments.set(format.segments)
        this.width.set(format.width)
        this.widthPadding.set(format.widthPadding)
        this.length.set(format.length)
        this.lengthRatio.set(format.lengthRatio)
        this.fill.set(format.fill)
        this.rgb.set(format.rgb)
        // this.movement.set(format.movement) TODO
        this.reverse.set(format.reverse)
        this.phase.set(format.phase)
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