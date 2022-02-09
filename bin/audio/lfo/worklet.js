export class LfoWorklet extends AudioWorkletNode {
    constructor(context) {
        super(context, "lfo", {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [1],
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        });
        this.$shape = null;
        this.$frequency = NaN;
    }
    set shape(value) {
        if (this.$shape == value) {
            return;
        }
        this.$shape = value;
        this.port.postMessage({ type: "set-shape", shape: value });
    }
    get shape() {
        return this.$shape;
    }
    set frequency(value) {
        if (this.$frequency == value) {
            return;
        }
        this.$frequency = value;
        this.port.postMessage({ type: "set-frequency", hz: value });
    }
    get frequency() {
        return this.$frequency;
    }
}
//# sourceMappingURL=worklet.js.map