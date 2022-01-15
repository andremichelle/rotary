import {Exp} from "../lib/mapping.js"

registerProcessor("mapping", class extends AudioWorkletProcessor {
    private readonly mapping: Exp = new Exp(240.0, 12000.0)

    constructor() {
        super()
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        const input = inputs[0]
        const output = outputs[0]
        const numChannels = Math.min(output.length, input.length)
        for (let channelIndex = 0; channelIndex < numChannels; channelIndex++) {
            const inp = input[channelIndex]
            const out = output[channelIndex]
            for (let i = 0; i < 128; i++) {
                out[i] = this.mapping.y(inp[i])
            }
        }
        return true
    }
})