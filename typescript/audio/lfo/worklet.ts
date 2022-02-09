import {Shape} from "./messages.js"

export class LfoWorklet extends AudioWorkletNode {
    private $shape: Shape = null
    private $frequency: number = NaN

    constructor(context) {
        super(context, "lfo", {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [1],
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        })
    }

    set shape(value: Shape) {
        if (this.$shape == value) {
            return
        }
        this.$shape = value
        this.port.postMessage({type: "set-shape", shape: value})
    }

    get shape(): Shape {
        return this.$shape
    }

    set frequency(value: number) {
        if (this.$frequency == value) {
            return
        }
        this.$frequency = value
        this.port.postMessage({type: "set-frequency", hz: value})
    }

    get frequency(): number {
        return this.$frequency
    }
}