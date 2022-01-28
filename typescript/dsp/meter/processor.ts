import {RenderQuantum, RMS} from "../common.js"
import {UpdateMeterMessage} from "./message.js"

registerProcessor("dsp-meter", class extends AudioWorkletProcessor {
    private readonly maxPeaks: Float32Array = new Float32Array(2)
    private readonly maxSquares: Float32Array = new Float32Array(2)
    private readonly updateRate: number
    private readonly rmsChannels: RMS[]

    private updateCount: number = 0 | 0

    constructor(options) {
        super(options)

        const rmsSize: number = sampleRate * 0.050 // 50ms

        const fps: number = 60.0
        this.updateRate = (sampleRate / fps) | 0
        this.rmsChannels = [new RMS(rmsSize), new RMS(rmsSize)]
    }

    // noinspection JSUnusedGlobalSymbols
    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        const input: Float32Array[] = inputs[0]
        const output: Float32Array[] = outputs[0]
        for (let channel: number = 0 | 0; channel < output.length; ++channel) {
            const inputChannel: Float32Array = input[channel]
            const outputChannel: Float32Array = output[channel]
            const rms: RMS = this.rmsChannels[channel]
            let maxPeak: number = this.maxPeaks[channel]
            let maxSquare: number = this.maxSquares[channel]
            if (undefined === inputChannel) {
                this.maxPeaks[channel] = 0.0
                this.maxSquares[channel] = 0.0
            } else {
                for (let i: number = 0 | 0; i < inputChannel.length; ++i) {
                    const inp: number = outputChannel[i] = inputChannel[i] // we pass the signal
                    maxPeak = Math.max(maxPeak, Math.abs(inp))
                    maxSquare = Math.max(maxSquare, rms.pushPop(inp * inp))
                }
                this.maxPeaks[channel] = maxPeak
                this.maxSquares[channel] = maxSquare
            }
        }
        this.updateCount += RenderQuantum
        if (this.updateCount >= this.updateRate) {
            this.updateCount -= this.updateRate
            this.port.postMessage(new UpdateMeterMessage(this.maxSquares, this.maxPeaks))
            for (let channel: number = 0 | 0; channel < 2; ++channel) {
                this.maxPeaks[channel] = 0.0
                this.maxSquares[channel] = 0.0
            }
        }
        return true
    }
})