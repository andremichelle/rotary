import {Function} from "../lib/math.js"
import {RotaryFormat, RotaryModel} from "../rotary/model.js"

registerProcessor("rotary-automation", class extends AudioWorkletProcessor {
    private readonly model: RotaryModel = new RotaryModel()
    private readonly envelopes = new Float32Array(RotaryModel.MAX_TRACKS)
    private coeff: number = 0.0
    private phase: number = 0.0
    private loopInSeconds: number = 1.0
    private tMin: number = 0.60
    private tMax: number = 1.00

    constructor() {
        super()

        this.port.onmessage = (event: MessageEvent) => {
            const data = event.data
            if (data.action === "format") {
                this.model.deserialize(data.value as RotaryFormat)
            } else if (data.action === "loopInSeconds") {
                this.loopInSeconds = data.value
            } else if (data.action === "envelope") {
                this.updateEnvelope(data.value)
            }
        }
        this.updateEnvelope(0.005)
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        const channels = outputs[0]
        const tracks = this.model.tracks
        const phaseIncr = 1.0 / sampleRate
        for (let frameIndex = 0; frameIndex < 128; frameIndex++) {
            const localPhase = this.phase / this.loopInSeconds
            for (let trackIndex = 0; trackIndex < tracks.size(); trackIndex++) {
                const track = tracks.get(trackIndex)
                const x = track.ratio(localPhase)
                const y = Function.step(this.tMin, this.tMax, x)
                const env = this.envelopes[trackIndex]
                this.envelopes[trackIndex] = y + this.coeff * (env - y)
                channels[trackIndex][frameIndex] = env
            }
            this.phase += phaseIncr
        }
        return true
    }

    updateEnvelope(seconds: number) {
        this.coeff = Math.exp(-1.0 / (sampleRate * seconds))
    }
})