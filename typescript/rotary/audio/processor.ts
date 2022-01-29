import {Edge, QueryResult, RotaryModel} from "../model.js"
import {MessageToProcessor} from "./messages-to-processor.js"
import {TransportMessage, UpdateCursorMessage} from "./messages-to-worklet.js"
import {RenderQuantum} from "../../dsp/common.js"
import {ObservableValueImpl} from "../../lib/common.js"

class Voice {
    static ATTACK = (0.010 * sampleRate) | 0
    static RELEASE = (0.050 * sampleRate) | 0

    duration: number = Number.MAX_SAFE_INTEGER

    constructor(public delayFrames: number, readonly output: number, readonly sampleKey: number, public position: number = 0 | 0) {
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

registerProcessor("rotary", class extends AudioWorkletProcessor {
        private readonly model: RotaryModel = new RotaryModel()
        private readonly samples: Map<number, Sample> = new Map()
        private readonly activeVoices: Map<number, Voice[]> = new Map()
        private readonly transport: ObservableValueImpl<boolean> = new ObservableValueImpl<boolean>(false)

        private maxKey: number = 0 | 0
        private phase: number = 0 | 0
        private updateRate: number
        private updateCount: number = 0 | 0

        constructor() {
            super()

            const fps: number = 60.0
            this.updateRate = (sampleRate / fps) | 0
            this.transport.addObserver(moving => this.port.postMessage(new TransportMessage(moving)))
            this.port.onmessage = (event: MessageEvent) => {
                const msg = event.data as MessageToProcessor
                if (msg.type === "format") {
                    this.model.deserialize(msg.format)
                } else if (msg.type === "sample") {
                    this.samples.set(msg.key, new Sample(msg.sample, msg.loop))
                    this.maxKey = Math.max(msg.key, this.maxKey)
                } else if (msg.type === "rewind") {
                    this.phase = 0.0
                    this.transport.set(false)
                    this.activeVoices.forEach(voices => voices.forEach(voice => voice.stop()))
                } else if (msg.type === "transport") {
                    this.transport.set(msg.moving)
                }
            }
            for (let index = 0; index < RotaryModel.MAX_TRACKS; index++) {
                this.activeVoices.set(index, [])
            }
        }

        // noinspection JSUnusedGlobalSymbols
        process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
            if (this.transport.get()) {
                this.schedule()
            }
            for (let index = 0; index < RotaryModel.MAX_TRACKS; index++) {
                const voices = this.activeVoices.get(index)
                for (let voiceIndex = voices.length - 1; 0 <= voiceIndex; voiceIndex--) {
                    const voice: Voice = voices[voiceIndex]
                    const sample: Sample = this.samples.get(voice.sampleKey)
                    if (sample === undefined) continue
                    const frames: Float32Array[] = sample.frames
                    const output = outputs[voice.output]
                    const outL = output[0]
                    const outR = output[1]
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
            this.updateCount += RenderQuantum
            if (this.updateCount >= this.updateRate) {
                this.updateCount -= this.updateRate
                this.port.postMessage(new UpdateCursorMessage(this.phase / this.loopFrames()))
            }
            return true
        }

        private schedule(): void {
            const tracks = this.model.tracks
            const loopFrames = this.loopFrames()
            const x0 = this.phase / loopFrames
            const x1 = (this.phase + RenderQuantum) / loopFrames
            for (let trackIndex = 0; trackIndex < tracks.size(); trackIndex++) {
                const track = tracks.get(trackIndex)
                const t0 = track.globalToLocal(x0)
                const t1 = track.globalToLocal(x1)
                const iterator = track.querySections(t0, t1)
                while (iterator.hasNext()) {
                    const result: QueryResult = iterator.next()
                    const running = this.activeVoices.get(trackIndex)
                    running.forEach(v => v.stop())
                    if (result.edge === Edge.Start) {
                        let frameIndex: number
                        if (Math.abs(t1 - t0) < 1e-11) {
                            console.warn(`clamp frameIndex while abs(t1 - t0) = ${Math.abs(t1 - t0)} < 1e-11`)
                            frameIndex = 0 | 0
                        } else {
                            frameIndex = ((track.localToGlobal(result.position) * loopFrames - this.phase)) | 0
                        }
                        if (0 > frameIndex || frameIndex >= RenderQuantum) {
                            throw new Error(`frameIndex(${frameIndex}), 
                            t0: ${t0}, t1: ${t1}, t0*: ${t0 + 1e-7 - 1e-7}, t1*: ${t1 + 1e-7 - 1e-7}, 
                            td: ${t1 - t0}, p: ${result.position}, 
                                frameIndexAsNumber: ${(track.localToGlobal(result.position) * loopFrames - this.phase)}`)
                        }
                        const sampleKey = (trackIndex * track.segments.get() + result.index) % (this.maxKey + 1)
                        const voice = new Voice(-frameIndex, trackIndex, sampleKey, 0)
                        this.activeVoices.get(trackIndex).push(voice)
                    }
                }
            }
            this.phase += RenderQuantum
            this.phase %= loopFrames
        }

        private loopFrames(): number {
            return (sampleRate * this.model.loopDuration.get()) | 0
        }
    }
)