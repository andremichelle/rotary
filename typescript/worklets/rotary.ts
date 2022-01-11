import {DSP} from "../lib/dsp.js"
import {Function} from "../lib/math.js"
import {RotaryFormat, RotaryModel} from "../rotary/model.js"

class Rotary extends AudioWorkletProcessor {
    static MAX_NOTES = 32

    private readonly model: RotaryModel = new RotaryModel()
    private readonly phaseIncrements = new Float32Array(Rotary.MAX_NOTES)
    private readonly envelopes = new Float32Array(Rotary.MAX_NOTES)
    private readonly coeff: number = 0.0
    private phase: number = 0.0
    private loopInSeconds: number = 1.0
    private tMin: number = 0.60
    private tMax: number = 1.00

    constructor() {
        super()

        const notes = new Uint8Array([60, 62, 65, 67, 69])
        for (let i = 0; i < Rotary.MAX_NOTES; i++) {
            const o = Math.floor(i / notes.length) - 1
            const n = i % notes.length
            this.phaseIncrements[i] = DSP.midiToHz(notes[n] + o * 12) * 2.0 * Math.PI
        }

        const time = .005
        this.coeff = Math.exp(-1.0 / (sampleRate * time))

        this.port.onmessage = (event: MessageEvent) => {
            const data = event.data
            if (data.action === "format") {
                this.model.deserialize(data.value as RotaryFormat)
            } else if (data.action === "loopInSeconds") {
                this.loopInSeconds = data.value
            }
        }
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters?: { [name: string]: Float32Array }): boolean {
        const out = outputs[0][0]
        const tracks = this.model.tracks
        const localPhase = this.phase / this.loopInSeconds
        const phaseIncr = 1.0 / sampleRate
        for (let i = 0; i < out.length; i++) {
            let amp = 0.0
            tracks.forEach((track, index) => {
                if (index >= Rotary.MAX_NOTES) return
                const x = track.ratio(localPhase)
                const y = Function.step(this.tMin, this.tMax, x)
                const env = this.envelopes[index]
                this.envelopes[index] = y + this.coeff * (env - y)
                amp += Math.sin(this.phase * this.phaseIncrements[index]) * env
            })
            out[i] = amp * 0.03
            this.phase += phaseIncr
        }
        return true
    }
}

registerProcessor("rotary", Rotary)