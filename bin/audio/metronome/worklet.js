import { ObservableValueImpl } from "../../lib/common.js";
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
        this.enabled = new ObservableValueImpl(false);
        this.enabled.addObserver(value => this.port.postMessage({ type: "set-enabled", value: value }));
    }
    setBpm(value) {
        this.port.postMessage({ type: "set-bpm", value: value });
    }
    listenToTransport(transport) {
        return transport.addObserver(message => this.port.postMessage(message), false);
    }
}
//# sourceMappingURL=worklet.js.map