import {SetLookahead, SetThreshold} from "./message.js"

export class LimiterWorklet extends AudioWorkletNode {
    static async build(context: BaseAudioContext): Promise<LimiterWorklet> {
        await context.audioWorklet.addModule("bin/dsp/limiter/processor.js")
        return new LimiterWorklet(context)
    }

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
        this.threshold = -6.0
    }

    set lookahead(seconds) {
        if (this.$lookahead === seconds) {
            return
        }
        this.port.postMessage(new SetLookahead(seconds))
        this.$lookahead = seconds
    }

    get lookahead() {
        return this.$lookahead
    }

    set threshold(db) {
        if (this.$threshold === db) {
            return
        }
        this.port.postMessage(new SetThreshold(db))
        this.$threshold = db
    }

    get threshold() {
        return this.$threshold
    }
}