import {Linear, LinearInteger, ObservableValue, Terminable, Terminator} from "../common"

export enum Fill {
    Flat, Stroke, Positive, Negative
}

export class RotaryTrack implements Terminable {
    private readonly terminator: Terminator = new Terminator()

    readonly segments = this.terminator.with(new ObservableValue(new LinearInteger(1, 128), 8))
    readonly width = this.terminator.with(new ObservableValue(new LinearInteger(1, 128), 12))
    readonly widthRatio = this.terminator.with(new ObservableValue(Linear.Identity, 0.75))
    readonly length = this.terminator.with(new ObservableValue(Linear.Identity, 1.0))
    readonly lengthRatio = this.terminator.with(new ObservableValue(Linear.Identity, 0.5))
    readonly phase = this.terminator.with(new ObservableValue(Linear.Identity, 0.0))

    terminate() {
        this.terminator.terminate()
    }
}

export class Rotary implements Terminable {
    private readonly terminator: Terminator = new Terminator()

    readonly radiusMin = this.terminator.with(new ObservableValue(new LinearInteger(0, 128), 20))

    readonly tracks: RotaryTrack[] = [
        new RotaryTrack(),
        new RotaryTrack(),
        new RotaryTrack(),
        new RotaryTrack(),
        new RotaryTrack(),
        new RotaryTrack(),
        new RotaryTrack(),
        new RotaryTrack(),
        new RotaryTrack(),
        new RotaryTrack()
    ]

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