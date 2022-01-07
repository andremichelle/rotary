import {JsRandom} from "../lib/math.js"

registerProcessor("rotary", class extends AudioWorkletProcessor {
    private phase: number = 0.0

    constructor() {
        super()

        this.port.onmessage = (event: MessageEvent) => {
            console.log(event)
        }

        console.log(JsRandom.Instance)
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters?: { [name: string]: Float32Array }): boolean {
        const out = outputs[0][0]
        for (let i = 0; i < out.length; i++) {
            out[i] = Math.sin(this.phase * 2.0 * Math.PI) * 0.1
            this.phase += 220.0 / sampleRate
        }
        return true
    }
})