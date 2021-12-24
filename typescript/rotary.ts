import {LinearQuantizedValue, Terminable, Terminator} from "./common"

export class RotaryTrack implements Terminable {
    private readonly terminator: Terminator = new Terminator()

    public readonly numSegments = this.terminator.with(new LinearQuantizedValue(8, 1, 128, 1))
    public readonly width = this.terminator.with(new LinearQuantizedValue(12, 1, 128, 1))
    public readonly widthRatio = this.terminator.with(new LinearQuantizedValue(100, 1, 100, 1))
    public readonly length = this.terminator.with(new LinearQuantizedValue(50, 1, 100, 1))
    public readonly lengthRatio = this.terminator.with(new LinearQuantizedValue(100, 1, 100, 1))

    terminate() {
        this.terminator.terminate()
    }
}