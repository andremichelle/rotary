import {Edge, FilterResult, RotaryModel} from "../rotary/model.js"
import {Message} from "./worklet.js"
import {RenderQuantum} from "../dsp/common.js"

class Voice {
    static RELEASE = (0.005 * sampleRate) | 0

    duration: number = Number.MAX_SAFE_INTEGER

    constructor(readonly sampleKey: number, public position: number = 0 | 0) {
    }

    stop() {
        if (this.duration > Voice.RELEASE) {
            this.duration = Voice.RELEASE
        }
    }
}

registerProcessor("rotary-playback", class extends AudioWorkletProcessor {
        private readonly model: RotaryModel = new RotaryModel()
        private phase: number = 0 | 0
        private samples: Map<number, Float32Array[]> = new Map()
        private readonly voiceMap: Map<number, Voice[]> = new Map()

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

            for (let index = 0; index < RotaryModel.MAX_TRACKS; index++) {
                this.voiceMap.set(index, [])
            }
        }

        // noinspection JSUnusedGlobalSymbols
        process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
            const output = outputs[0]
            const outL = output[0]
            const outR = output[1]
            const tracks = this.model.tracks
            const loopLength = (sampleRate * this.model.loopDuration.get()) | 0
            const x0 = this.phase / loopLength
            const x1 = (this.phase + RenderQuantum) / loopLength
            for (let trackIndex = 0; trackIndex < tracks.size(); trackIndex++) {
                const track = tracks.get(trackIndex)
                const t0 = track.globalToLocal(x0)
                const t1 = track.globalToLocal(x1)
                const iterator = track.filterSections(t0, t1)
                while (iterator.hasNext()) {
                    const result: FilterResult = iterator.next()
                    const running = this.voiceMap.get(trackIndex)
                    running.forEach(v => v.stop())
                    if (result.edge === Edge.Start) {
                        const frameIndex = ((track.localToGlobal(result.position) * loopLength - this.phase)) | 0
                        if (0 > frameIndex || frameIndex >= RenderQuantum) {
                            throw new Error(`frameIndex(${frameIndex}), t0: ${t0}, t1: ${t1}, p: ${result.position}, 
                                frameIndexAsNumber: ${(track.localToGlobal(result.position) * loopLength - this.phase)}`)
                        }
                        const num = 5
                        const key: number = this.phase < loopLength / 2 ? trackIndex % num : num + (trackIndex % num)
                        this.voiceMap.get(trackIndex).push(new Voice(key, -frameIndex))
                    }
                }
            }
            for (let voices of this.voiceMap.values()) {
                for (let i = 0; i < voices.length; i++) {
                    const voice = voices[i]
                    const sample: Float32Array[] = this.samples.get(voice.sampleKey)
                    if (sample === undefined) continue
                    for (let frameIndex = 0; frameIndex < RenderQuantum; frameIndex++) {
                        const position = voice.position++
                        if (position >= sample[0].length || 0 === voice.duration) {
                            voices.splice(i, 1)
                        } else if (position >= 0) {
                            const envelope = Math.min(1.0, voice.duration-- / Voice.RELEASE) * Math.min(1.0, position / Voice.RELEASE)
                            outL[frameIndex] += sample[0][position] * envelope * 0.02
                            outR[frameIndex] += sample[1][position] * envelope * 0.02
                        }
                    }
                }
            }
            this.phase += RenderQuantum
            this.phase %= loopLength
            return true
        }
    }
)