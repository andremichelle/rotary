export class LimiterWorklet extends AudioWorkletNode {
    private $lookahead: number = NaN
    private $threshold: number = NaN

    constructor(context) {
        super(context, "limiter", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            channelCount: 2,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        })

        this.lookahead = 0.005
        this.threshold = -3.0
    }

    set lookahead(seconds) {
        if (this.$lookahead === seconds) {
            return
        }
        this.port.postMessage({type: "set-lookahead", seconds: seconds})
        this.$lookahead = seconds
    }

    get lookahead() {
        return this.$lookahead
    }

    set threshold(db) {
        if (this.$threshold === db) {
            return
        }
        this.port.postMessage({type: "set-threshold", db: db})
        this.$threshold = db
    }

    get threshold() {
        return this.$threshold
    }
}