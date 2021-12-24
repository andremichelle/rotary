import {LinearQuantizedValue, Terminable} from "./common"

export class RotaryTrack implements Terminable {
    public readonly numSegments = new LinearQuantizedValue(1, 128)

    terminate() {
        this.numSegments.terminate()
    }
}