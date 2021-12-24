import {Linear, LinearInteger, ObservableValue, Terminable, Terminator} from "./common"

export class RotaryTrack implements Terminable {
    private readonly terminator: Terminator = new Terminator()

    readonly numSegments = this.terminator.with(new ObservableValue(new LinearInteger(1, 128), 8))
    readonly width = this.terminator.with(new ObservableValue(new LinearInteger(1, 128), 12))
    readonly widthRatio = this.terminator.with(new ObservableValue(Linear.Identity, 1.0))

    terminate() {
        this.terminator.terminate()
    }
}

export class Rotary implements Terminable {
    private readonly terminator: Terminator = new Terminator()

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
    readonly radiusMin = this.terminator.with(new ObservableValue(new LinearInteger(0, 128), 20))

    terminate() {
        this.terminator.terminate()
    }
}