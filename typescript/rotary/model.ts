import {Linear, LinearInteger, ObservableValue, Parameter, Terminable, Terminator} from "../lib/common"

export class RotaryModel implements Terminable {
    private readonly terminator: Terminator = new Terminator()

    readonly radiusMin = this.terminator.with(new Parameter(new LinearInteger(0, 128), 20))

    readonly tracks: RotaryTrackModel[] = []

    constructor() {
        this.randomize()
    }

    randomize() {
        this.tracks.splice(0, this.tracks.length)

        for (let i = 0; i < 12; i++) {
            const segments = 1 + Math.floor(Math.random() * 9)
            const lengthRatioExp = -Math.floor(Math.random() * 3)
            const lengthRatio = 0 === lengthRatioExp ? 1.0 : Math.random() < 0.5 ? 1.0 - Math.pow(2.0, lengthRatioExp) : Math.pow(2.0, lengthRatioExp)
            const width = Math.random() < 0.1 ? 24.0 : 12.0
            const widthRatio = Math.random()
            const length = Math.random() < 0.1 ? 0.75 : 1.0
            const fill = 2 === segments ? Fill.Positive : Math.random() < 0.2 ? Fill.Stroke : Fill.Flat
            const trackModel = new RotaryTrackModel()
            trackModel.segments.set(0 === lengthRatioExp ? 1 : segments)
            trackModel.width.set(width)
            trackModel.widthRatio.set(widthRatio)
            trackModel.length.set(length)
            trackModel.lengthRatio.set(lengthRatio)
            trackModel.fill.set(fill)
            trackModel.movement.set(randomMovement())
            this.tracks.push(trackModel)
        }
    }

    removeTrack(track: RotaryTrackModel) {
        const index = this.tracks.indexOf(track)
        if (-1 < index) {
            this.tracks.splice(index, 1)
            track.terminate()
        }
    }

    measureRadius() {
        let radiusMin = this.radiusMin.get()
        for (let i = 0; i < this.tracks.length; i++) {
            radiusMin += this.tracks[i].width.get()
        }
        return radiusMin
    }

    terminate() {
        this.terminator.terminate()
    }
}

export enum Fill {
    Flat, Stroke, Positive, Negative
}

const AccAndStop = exp => x => Math.pow(x, exp)
const OddShape = shape => { // https://www.desmos.com/calculator/bpbuua3l0j
    const o = Math.pow(2.0, shape)
    const c = Math.pow(2.0, o - 1)
    return x => c * Math.sign(x - 0.5) * Math.pow(Math.abs(x - 0.5), o) + 0.5
}
export type Move = (x: number) => number
export const Movements = new Map([
    ["Linear", x => x],
    ["Sine", x => Math.sin(x * Math.PI)],
    ["StopAndGo", x => 1.0 - Math.min(1.0, 2.0 * (2.0 * x - Math.floor(2.0 * x)))],
    ["AccAndStop 2", AccAndStop(2.0)],
    ["AccAndStop 3", AccAndStop(3.0)],
    ["OddShape -1", OddShape(-1.0)],
    ["OddShape 1", OddShape(1.0)],
    ["OddShape 2", OddShape(2.0)],
])
export const randomMovement = (): Move => {
    const array = Array.from(Movements)
    return array[Math.floor(Math.random() * array.length)][1]
}
export const Fills = new Map<string, Fill>(
    [["Flat", Fill.Flat], ["Stroke", Fill.Stroke], ["Gradient+", Fill.Positive], ["Gradient-", Fill.Negative]])

export class RotaryTrackModel implements Terminable {
    private readonly terminator: Terminator = new Terminator()

    readonly segments = this.terminator.with(new Parameter(new LinearInteger(1, 128), 8))
    readonly width = this.terminator.with(new Parameter(new LinearInteger(1, 128), 12))
    readonly widthRatio = this.terminator.with(new Parameter(Linear.Identity, 0.75))
    readonly length = this.terminator.with(new Parameter(Linear.Identity, 1.0))
    readonly lengthRatio = this.terminator.with(new Parameter(Linear.Identity, 0.5))
    readonly phase = this.terminator.with(new Parameter(Linear.Identity, 0.0))
    readonly fill = this.terminator.with(new ObservableValue<Fill>(Fill.Flat))
    readonly movement = this.terminator.with(new ObservableValue<Move>(Movements.values().next().value))
    readonly reverse = this.terminator.with(new ObservableValue<boolean>(false))

    constructor() {
    }

    terminate() {
        this.terminator.terminate()
    }
}