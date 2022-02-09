import {Edge, QueryResult, RotaryModel} from "../model.js"
import {MessageToProcessor} from "./messages-to-processor.js"
import {barsToNumFrames, numFramesToBars, RENDER_QUANTUM} from "../../audio/common.js"
import {ObservableValueImpl} from "../../lib/common.js"
import {TransportMessage} from "../../audio/sequencing.js"

class Sample {
    constructor(readonly frames: Float32Array[], readonly numFrames: number, readonly loop: boolean) {
    }
}

class SampleVoice {
    static ATTACK = (0.010 * sampleRate) | 0
    static RELEASE = (0.050 * sampleRate) | 0

    duration: number = Number.MAX_SAFE_INTEGER

    constructor(public startIndex: number, readonly output: number, readonly sample: Sample, public position: number = 0 | 0) {
    }

    process(outL: Float32Array, outR: Float32Array): boolean {
        const sample: Sample = this.sample
        const ch0 = sample.frames[0]
        const ch1 = sample.frames[1]
        for (let frameIndex = this.startIndex; frameIndex < RENDER_QUANTUM; frameIndex++) {
            const position = this.position++
            const duration = this.duration--
            const numFrames = sample.numFrames
            if (0 === duration || (!sample.loop && position >= numFrames)) {
                return true
            } else {
                const envelope = Math.min(1.0, duration / SampleVoice.RELEASE) * Math.min(1.0, position / SampleVoice.ATTACK)
                if (sample.loop) {
                    outL[frameIndex] += ch0[position % numFrames] * envelope
                    outR[frameIndex] += ch1[position % numFrames] * envelope
                } else {
                    outL[frameIndex] += ch0[position] * envelope
                    outR[frameIndex] += ch1[position] * envelope
                }
            }
        }
        this.startIndex = 0
        return false
    }

    stop() {
        if (this.duration > SampleVoice.RELEASE) {
            this.duration = SampleVoice.RELEASE
        }
    }
}

registerProcessor("rotary", class extends AudioWorkletProcessor {
        private readonly model: RotaryModel = new RotaryModel()
        private readonly samples: Map<number, Sample> = new Map()
        private readonly activeVoices: Map<number, SampleVoice[]> = new Map()
        private readonly transport: ObservableValueImpl<boolean> = new ObservableValueImpl<boolean>(false)

        private readonly updateRate: number
        private updateCount: number = 0 | 0
        private maxKey: number = 0 | 0
        private barPosition: number = +0.0

        constructor() {
            super()

            const fps: number = 60.0
            this.updateRate = (sampleRate / fps) | 0
            this.port.onmessage = (event: MessageEvent) => {
                const msg = event.data as MessageToProcessor | TransportMessage
                if (msg.type === "update-format") {
                    this.model.deserialize(msg.format)
                    this.port.postMessage({type: "format-updated", version: msg.version})
                } else if (msg.type === "upload-sample") {
                    this.samples.set(msg.key, new Sample(msg.frames, msg.numFrames, msg.loop))
                    this.maxKey = Math.max(msg.key, this.maxKey)
                } else if (msg.type === "transport-play") {
                    this.transport.set(true)
                } else if (msg.type === "transport-pause") {
                    this.transport.set(false)
                    this.activeVoices.forEach(voices => voices.forEach(voice => voice.stop()))
                } else if (msg.type === "transport-move") {
                    this.barPosition = msg.position
                    this.transport.set(false)
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
                    const voice: SampleVoice = voices[voiceIndex]
                    const output = outputs[voice.output]
                    const complete = voice.process(output[0], output[1])
                    if (complete) {
                        voices.splice(voiceIndex, 1)
                    }
                }
            }
            this.updateCount += RENDER_QUANTUM
            if (this.updateCount >= this.updateRate) {
                this.updateCount -= this.updateRate
                this.port.postMessage({type: "update-cursor", position: this.barPosition})
            }
            return true
        }

        private schedule(): void {
            const tracks = this.model.tracks
            const bpm = this.model.bpm.get()
            const p0 = this.barPosition
            const p1 = p0 + numFramesToBars(RENDER_QUANTUM, bpm, sampleRate) / this.model.stretch.get()
            for (let trackIndex = 0; trackIndex < tracks.size(); trackIndex++) {
                const track = tracks.get(trackIndex)
                const t0 = track.globalToLocal(p0)
                const t1 = track.globalToLocal(p1)
                const iterator = track.querySections(t0, t1)
                while (iterator.hasNext()) {
                    const result: QueryResult = iterator.next()
                    const running = this.activeVoices.get(trackIndex)
                    running.forEach(v => v.stop())
                    if (result.edge === Edge.Start) {
                        let frameIndex: number = barsToNumFrames(track.localToGlobal(result.position) - p0, bpm, sampleRate) | 0
                        if (0 > frameIndex || frameIndex >= RENDER_QUANTUM) {
                            if (Math.abs(t1 - t0) < 1e-10) {
                                console.warn(`clamp frameIndex(${frameIndex}) while abs(t1 - t0) = ${Math.abs(t1 - t0)} < 1e-10`)
                                frameIndex = 0 | 0
                            } else {
                                throw new Error(`frameIndex(${frameIndex}), 
                            t0: ${t0}, t1: ${t1}, t0*: ${t0 + 1e-7 - 1e-7}, t1*: ${t1 + 1e-7 - 1e-7}, 
                            td: ${t1 - t0}, p: ${result.position}, 
                                frameIndexAsNumber: ${(track.localToGlobal(result.position) - p0)}`)
                            }
                        }
                        const sampleKey = (trackIndex * track.segments.get() + result.index) % (this.maxKey + 1)
                        const sample = this.samples.get(sampleKey)
                        const voice = new SampleVoice(frameIndex, trackIndex, sample, 0)
                        this.activeVoices.get(trackIndex).push(voice)
                    }
                }
            }
            this.barPosition = p1
        }
    }
)