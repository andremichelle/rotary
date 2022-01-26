import {Edge, FilterResult, RotaryModel} from "../rotary/model.js"
import {Message} from "./worklet.js"
import {RenderQuantum} from "../dsp/common.js"

class Voice {
    static ATTACK = (0.005 * sampleRate) | 0
    static RELEASE = (0.050 * sampleRate) | 0

    position: number = 0 | 0
    duration: number = Number.MAX_SAFE_INTEGER

    constructor(readonly sampleKey: number, public delayFrames: number) {
    }

    stop() {
        if (this.duration > Voice.RELEASE) {
            this.duration = Voice.RELEASE
        }
    }
}

class Sample {
    constructor(readonly frames: Float32Array[], readonly loop: boolean) {
    }
}

registerProcessor("rotary-playback", class extends AudioWorkletProcessor {
        private readonly model: RotaryModel = new RotaryModel()
        private readonly samples: Map<number, Sample> = new Map()
        private readonly activeVoices: Map<number, Voice[]> = new Map()

        private phase: number = 0 | 0

        constructor() {
            super()

            this.port.onmessage = (event: MessageEvent) => {
                const msg = event.data as Message
                if (msg.type === "format") {
                    this.model.deserialize(msg.format)
                } else if (msg.type === "sample") {
                    this.samples.set(msg.key, new Sample(msg.sample, msg.loop))
                }
            }

            for (let index = 0; index < RotaryModel.MAX_TRACKS; index++) {
                this.activeVoices.set(index, [])
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
            for (let trackIndex = 0; trackIndex < tracks.size() ; trackIndex++) {
                const track = tracks.get(trackIndex)
                const t0 = track.globalToLocal(x0)
                const t1 = track.globalToLocal(x1)
                const iterator = track.filterSections(t0, t1)
                while (iterator.hasNext()) {
                    const result: FilterResult = iterator.next()
                    const running = this.activeVoices.get(trackIndex)
                    running.forEach(v => v.stop())
                    if (result.edge === Edge.Start) {
                        const frameIndex = ((track.localToGlobal(result.position) * loopLength - this.phase)) | 0
                        if (0 > frameIndex || frameIndex >= RenderQuantum) {
                            throw new Error(`frameIndex(${frameIndex}), t0: ${t0}, t1: ${t1}, p: ${result.position}, 
                                frameIndexAsNumber: ${(track.localToGlobal(result.position) * loopLength - this.phase)}`)
                        }
                        const num = 5
                        const key: number = this.phase < loopLength / 2 ? trackIndex % num : num + (trackIndex % num)
                        this.activeVoices.get(trackIndex).push(new Voice(key, -frameIndex))
                    }
                }
            }
            for (let index = 0; index < RotaryModel.MAX_TRACKS; index++) {
                const voices = this.activeVoices.get(index)
                for (let voiceIndex = voices.length - 1; 0 <= voiceIndex; voiceIndex--) {
                    const voice: Voice = voices[voiceIndex]
                    const sample: Sample = this.samples.get(voice.sampleKey)
                    if (sample === undefined) continue
                    const frames: Float32Array[] = sample.frames
                    for (let frameIndex = 0; frameIndex < RenderQuantum; frameIndex++) {
                        if (0 <= voice.delayFrames) {
                            const position = voice.position++
                            const duration = voice.duration--
                            const numFrames = frames[0].length
                            const complete = 0 === duration || (!sample.loop && position >= numFrames)
                            if (complete) {
                                voices.splice(voiceIndex, 1)
                                break
                            } else {
                                const envelope = Math.min(1.0, duration / Voice.RELEASE) * Math.min(1.0, position / Voice.ATTACK)
                                if (sample.loop) {
                                    outL[frameIndex] += frames[0][position % numFrames] * envelope
                                    outR[frameIndex] += frames[1][position % numFrames] * envelope
                                } else {
                                    outL[frameIndex] += frames[0][position] * envelope
                                    outR[frameIndex] += frames[1][position] * envelope
                                }
                            }
                        } else {
                            voice.delayFrames++
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