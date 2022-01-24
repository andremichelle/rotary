import {Func} from "../lib/math.js"
import {RotaryModel} from "../rotary/model.js"
import {Message} from "./messages.js"

registerProcessor("rotary-automation", class extends AudioWorkletProcessor {
    private readonly envelopes = new Float32Array(RotaryModel.MAX_TRACKS)
    private readonly model: RotaryModel = new RotaryModel()
    private coeff: number = NaN
    private phase: number = 0.0
    private tMin: number = 0.00
    private tMax: number = 1.00

    constructor() {
        super()

        this.port.onmessage = (event: MessageEvent) => {
            const data = event.data as Message
            if (data.type === "format") {
                this.model.deserialize(data.format)
            }
        }
        this.updateEnvelope(0.005)
    }

    // noinspection JSUnusedGlobalSymbols
    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        const channels = outputs[0]
        const tracks = this.model.tracks
        const phaseIncr = 1.0 / sampleRate
        for (let frameIndex = 0; frameIndex < 128; frameIndex++) {
            const localPhase = this.phase / this.model.loopDuration.get()
            for (let trackIndex = 0; trackIndex < tracks.size(); trackIndex++) {
                const track = tracks.get(trackIndex)
                const x = track.ratio(localPhase)
                const y = Func.step(this.tMin, this.tMax, x)
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