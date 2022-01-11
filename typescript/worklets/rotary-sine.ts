import {DSP} from "../lib/dsp.js"
import {RotaryModel} from "../rotary/model.js"

registerProcessor("rotary-sine", class extends AudioWorkletProcessor {
    private readonly phaseIncrements = new Float32Array(RotaryModel.MAX_TRACKS)
    private phase: number = 0.0

    constructor() {
        super()

        const notes = new Uint8Array([60, 62, 65, 67, 69])
        for (let i = 0; i < RotaryModel.MAX_TRACKS; i++) {
            const o = Math.floor(i / notes.length) - 1
            const n = i % notes.length
            this.phaseIncrements[i] = DSP.midiToHz(notes[n] + o * 12) * 2.0 * Math.PI
        }
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        const outputFrames = outputs[0][0]
        const inputChannels = inputs[0]
        const phaseIncr = 1.0 / sampleRate
        for (let frameIndex = 0; frameIndex < outputFrames.length; frameIndex++) {
            let amp = 0.0
            for (let channelIndex = 0; channelIndex < inputChannels.length; channelIndex++) {
                amp += Math.sin(this.phase * this.phaseIncrements[channelIndex]) * inputChannels[channelIndex][frameIndex]
            }
            outputFrames[frameIndex] = amp * 0.03
            this.phase += phaseIncr
        }
        return true
    }
})