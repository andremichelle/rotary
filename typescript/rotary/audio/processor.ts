import {TransportMessage} from "../../audio/sequencing.js"
import {MessageToProcessor} from "./messages.js"
import {ObservableValueImpl} from "../../lib/common.js"
import {Edge, QueryResult, RotaryModel} from "../model.js"
import {barsToNumFrames, numFramesToBars, RENDER_QUANTUM} from "../../audio/common.js"
import {Sample, SampleRepository, SampleVoice} from "./samples.js"
import {VoiceManager} from "./voices.js"

registerProcessor("rotary", class extends AudioWorkletProcessor {
        private readonly model: RotaryModel = new RotaryModel()
        private readonly sampleRepository: SampleRepository = new SampleRepository()
        private readonly voiceManager: VoiceManager = new VoiceManager()
        private readonly transport: ObservableValueImpl<boolean> = new ObservableValueImpl<boolean>(false)

        private readonly updateRate: number
        private updateCount: number = 0 | 0
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
                    this.sampleRepository.set(msg.key, new Sample(msg.frames, msg.numFrames, msg.loop))
                } else if (msg.type === "transport-play") {
                    this.transport.set(true)
                } else if (msg.type === "transport-pause") {
                    this.transport.set(false)
                    this.voiceManager.stopAll()
                } else if (msg.type === "transport-move") {
                    this.barPosition = msg.position
                    this.transport.set(false)
                }
            }
        }

        // noinspection JSUnusedGlobalSymbols
        process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
            if (this.transport.get()) {
                this.schedule()
            }
            this.voiceManager.process(outputs)
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
                    this.voiceManager.stopByIndex(trackIndex)
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
                        if (true) {
                            const key = this.sampleRepository.modulo(trackIndex * track.segments.get() + result.index)
                            const sample = this.sampleRepository.get(key)
                            const voice = new SampleVoice(frameIndex, trackIndex, track, sample, 0)
                            this.voiceManager.add(trackIndex, voice)
                        } else {

                            // this.activeVoices.get(trackIndex).push(voice)
                        }
                    }
                }
            }
            this.barPosition = p1
        }
    }
)