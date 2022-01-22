import {Edge, FilterResult, RotaryModel} from "../rotary/model.js"
import {Message} from "./messages.js"
import {RenderQuantum} from "../dsp/common.js"

class Voice {
    constructor(public position: number = 0 | 0) {
    }
}

registerProcessor("rotary-playback", class extends AudioWorkletProcessor {
        private readonly model: RotaryModel = new RotaryModel()
        private loopInSeconds: number = 1.0
        private phase: number = 0.0
        private sample: Float32Array[] = null
        private readonly voices: Voice[] = []

        constructor() {
            super()

            this.port.onmessage = (event: MessageEvent) => {
                const msg = event.data as Message
                if (msg.type === "format") {
                    this.model.deserialize(msg.format)
                } else if (msg.type === "loop-duration") {
                    this.loopInSeconds = msg.seconds
                } else if (msg.type === "sample") {
                    this.sample = msg.sample
                }
            }
        }

        // noinspection JSUnusedGlobalSymbols
        process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
            const output = outputs[0]
            const outL = output[0]
            const outR = output[1]
            const tracks = this.model.tracks
            const loopInFrames = sampleRate * this.loopInSeconds
            for (let trackIndex = 0; trackIndex < tracks.size(); trackIndex++) {
                const track = tracks.get(trackIndex)
                const t0 = track.translatePhase(this.phase)
                const t1 = track.translatePhase(this.phase + RenderQuantum / loopInFrames)
                const iterator = track.filterSections(t0, t1)
                while (iterator.hasNext()) {
                    const result: FilterResult = iterator.next()
                    if (result.edge === Edge.Max) {
                        continue
                    }
                    const frameIndex = Math.floor((track.inversePhase(result.position - t0)) * loopInFrames)
                    console.assert(0 <= frameIndex && frameIndex < RenderQuantum, "out of bounds")
                    this.voices.push(new Voice(-frameIndex))
                }
            }
            for (let frameIndex = 0; frameIndex < RenderQuantum; frameIndex++) {
                let l = 0.0
                let r = 0.0
                for (let i = this.voices.length - 1; i >= 0; i--) {
                    const voice = this.voices[i]
                    const position = voice.position++
                    if (position >= this.sample[0].length) {
                        this.voices.splice(i, 1)
                    } else if (position >= 0) {
                        l += this.sample[0][position]
                        r += this.sample[1][position]
                    }
                }
                outL[frameIndex] = l * 0.3
                outR[frameIndex] = r * 0.3
            }
            this.phase += RenderQuantum / loopInFrames
            this.phase -= Math.floor(this.phase)
            return true
        }
    }
)