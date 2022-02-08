import { SetBpm } from "./message.js";
import { RewindMessage, TransportMessage } from "../messages.js";
export class Metronome extends AudioWorkletNode {
    constructor(context) {
        super(context, "metronome", {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [1],
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        });
    }
    rewind() {
        this.port.postMessage(new RewindMessage());
    }
    transport(moving) {
        this.port.postMessage(new TransportMessage(moving));
    }
    setBpm(value) {
        this.port.postMessage(new SetBpm(value));
    }
}
//# sourceMappingURL=worklet.js.map