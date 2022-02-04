import {RENDER_QUANTUM, RMS} from "../common.js"
import {UpdateMeterMessage} from "./message.js"
import {ArrayUtils} from "../../lib/common.js"

registerProcessor("dsp-meter", class extends AudioWorkletProcessor {
    private readonly numberOfLines: number
    private readonly channelCount: number

    private readonly maxPeaks: Float32Array[]
    private readonly maxSquares: Float32Array[]
    private readonly updateRate: number
    private readonly rmsChannels: RMS[][]

    private updateCount: number = 0 | 0

    constructor(options) {
        super(options)

        this.numberOfLines = options.numberOfInputs
        this.channelCount = options.channelCount
        console.assert(options.numberOfOutputs === this.numberOfLines)

        this.maxPeaks = ArrayUtils.fill(this.numberOfLines, () => new Float32Array(this.channelCount))
        this.maxSquares = ArrayUtils.fill(this.numberOfLines, () => new Float32Array(this.channelCount))

        const rmsSize: number = sampleRate * 0.050 // 50ms
        const fps: number = 60.0
        this.updateRate = (sampleRate / fps) | 0
        this.rmsChannels = ArrayUtils.fill(this.numberOfLines, () => ArrayUtils.fill(this.channelCount, () => new RMS(rmsSize)))
    }

    // noinspection JSUnusedGlobalSymbols
    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        for (let i = 0; i < this.numberOfLines; i++) {
            const input: Float32Array[] = inputs[i]
            const output: Float32Array[] = outputs[i]
            for (let channel: number = 0 | 0; channel < output.length; ++channel) {
                const inputChannel: Float32Array = input[channel]
                const outputChannel: Float32Array = output[channel]
                const rms: RMS = this.rmsChannels[i][channel]
                let maxPeak: number = this.maxPeaks[i][channel]
                let maxSquare: number = this.maxSquares[i][channel]
                if (undefined === inputChannel) {
                    this.maxPeaks[i][channel] = 0.0
                    this.maxSquares[i][channel] = 0.0
                } else {
                    for (let i: number = 0 | 0; i < RENDER_QUANTUM; ++i) {
                        const inp: number = outputChannel[i] = inputChannel[i] // we pass the signal
                        maxPeak = Math.max(maxPeak, Math.abs(inp))
                        maxSquare = Math.max(maxSquare, rms.pushPop(inp * inp))
                    }
                    this.maxPeaks[i][channel] = maxPeak
                    this.maxSquares[i][channel] = maxSquare
                }
            }
        }
        this.updateCount += RENDER_QUANTUM
        if (this.updateCount >= this.updateRate) {
            this.updateCount -= this.updateRate
            this.port.postMessage(new UpdateMeterMessage(this.maxSquares, this.maxPeaks))
            for (let i = 0; i < this.numberOfLines; i++) {
                this.maxPeaks[i].fill(0.0)
                this.maxSquares[i].fill(0.0)
            }
        }
        return true
    }
})