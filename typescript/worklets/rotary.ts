import {RotaryFormat, RotaryModel} from "../rotary/model.js"
import {Chords} from "../lib/chords.js"
import {DSP} from "../lib/dsp.js"

registerProcessor("rotary", class extends AudioWorkletProcessor {
    private readonly model: RotaryModel = new RotaryModel()
    private readonly phaseIncrements = new Float32Array(32)
    private phase: number = 0.0
    private loopInSeconds: number = 1.0

    constructor() {
        super()

        const compose = Chords.compose(Chords.Minor, 60, 0, 5)
        for (let i = 0; i < 32; i++) {
            const o = Math.floor(i / compose.length)
            const n = i % compose.length
            this.phaseIncrements[i] = DSP.midiToHz(compose[n] + o * 12) * 2.0 * Math.PI
        }

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
        for (let i = 0; i < out.length; i++) {
            let amp = 0.0
            tracks.forEach((track, index) => {
                amp += Math.sin(this.phase * this.phaseIncrements[index]) * track.ratio(localPhase)
            })
            out[i] = amp * 0.03
            this.phase += 1.0 / sampleRate
        }
        return true
    }
})