import {Edge, FilterResult, RotaryModel} from "../rotary/model.js"
import {Message} from "./messages.js"
import {RenderQuantum} from "../dsp/common.js"

class Voice {
    constructor(readonly sampleKey: number, public position: number = 0 | 0) {
    }
}

registerProcessor("rotary-playback", class extends AudioWorkletProcessor {
        private readonly model: RotaryModel = new RotaryModel()
        private phase: number = 0.0
        private samples: Map<number, Float32Array[]> = new Map()
        private readonly voices: Voice[] = []

        constructor() {
            super()

            this.port.onmessage = (event: MessageEvent) => {
                const msg = event.data as Message
                if (msg.type === "format") {
                    this.model.deserialize(msg.format)
                } else if (msg.type === "sample") {
                    this.samples.set(msg.key, msg.sample)
                }
            }
        }

        // noinspection JSUnusedGlobalSymbols
        process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
            const output = outputs[0]
            const outL = output[0]
            const outR = output[1]
            const tracks = this.model.tracks
            const loopInFrames = sampleRate * this.model.loopDuration.get()
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
                    const frameIndex = ((track.inversePhase(result.position) - this.phase) * loopInFrames) | 0
                    console.assert(0 <= frameIndex && frameIndex < RenderQuantum,
                        `frameIndex(${frameIndex}), t0: ${t0}, t1: ${t1}, p: ${result.position}, 
                        frameIndexAsNumber: ${(track.inversePhase(result.position) - this.phase) * loopInFrames}`)
                    const key: number = trackIndex % 9
                    this.voices.push(new Voice(key, -frameIndex))
                }
            }
            for (let frameIndex = 0; frameIndex < RenderQuantum; frameIndex++) {
                let l = 0.0
                let r = 0.0
                for (let i = this.voices.length - 1; i >= 0; i--) {
                    const voice = this.voices[i]
                    const position = voice.position++
                    const sample: Float32Array[] = this.samples.get(voice.sampleKey)
                    if (sample === undefined) continue
                    if (position >= sample[0].length) {
                        this.voices.splice(i, 1)
                    } else if (position >= 0) {
                        l += sample[0][position]
                        r += sample[1][position]
                    }
                }
                outL[frameIndex] = l
                outR[frameIndex] = r
            }
            this.phase += RenderQuantum / loopInFrames
            return true
        }
    }
)