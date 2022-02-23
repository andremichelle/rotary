import {TransportMessage} from "../../audio/sequencing.js"
import {MessageToProcessor} from "./messages.js"
import {ArrayUtils, ObservableValueImpl} from "../../lib/common.js"
import {RotaryModel} from "../model/rotary.js"
import {Edge, QueryResult} from "../model/track.js"
import {barsToNumFrames, numFramesToBars, RENDER_QUANTUM} from "../../audio/common.js"
import {Voice, VoiceManager} from "./voices.js"
import {Sample, SampleRepository, SampleVoice} from "./samples.js"
import {OscillatorVoice} from "./oscillators.js"
import {OscillatorSettings, SamplePlayerSettings} from "../model/sound.js"
import {Mulberry32} from "../../lib/math.js"

registerProcessor("rotary", class extends AudioWorkletProcessor {
        private readonly model: RotaryModel = new RotaryModel()
        private readonly sampleRepository: SampleRepository = new SampleRepository()
        private readonly voiceManager: VoiceManager = new VoiceManager()
        private readonly positions = new Float32Array(RENDER_QUANTUM)
        private readonly transport: ObservableValueImpl<boolean> = new ObservableValueImpl<boolean>(false)
        private readonly ranIntMap: Uint16Array = new Uint16Array(2048)

        private readonly updateRate: number
        private updateCount: number = 0 | 0
        private barPosition: number = +0.0

        constructor() {
            super()

            for (let i = 0; i < this.ranIntMap.length; i++) {
                this.ranIntMap[i] = i
            }

            const fps: number = 60.0
            this.updateRate = (sampleRate / fps) | 0
            this.port.onmessage = (event: MessageEvent) => {
                const msg = event.data as MessageToProcessor | TransportMessage
                if (msg.type === "update-format") {
                    this.model.deserialize(msg.format)
                    ArrayUtils.shuffle(this.ranIntMap, this.ranIntMap.length, new Mulberry32(this.model.seed.get()))
                    console.log(this.ranIntMap)
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
            const p0 = this.barPosition
            const p1 = p0 + numFramesToBars(RENDER_QUANTUM, this.model.bpm.get(), sampleRate) / this.model.stretch.get()

            if (this.transport.get()) {
                this.schedule(p0, p1)
            }
            for (let i = 0; i < RENDER_QUANTUM; i++) {
                this.positions[i] = p0 + i / RENDER_QUANTUM * (p1 - p0)
            }
            this.voiceManager.process(outputs, this.positions)
            this.updateCount += RENDER_QUANTUM
            if (this.updateCount >= this.updateRate) {
                this.updateCount -= this.updateRate
                this.port.postMessage({type: "update-cursor", position: this.barPosition})
            }
            return true
        }

        private schedule(from: number, to: number): void {
            const tracks = this.model.tracks
            const bpm = this.model.bpm.get()
            for (let trackIndex = 0; trackIndex < tracks.size(); trackIndex++) {
                const track = tracks.get(trackIndex)
                const t0 = track.globalToLocal(from)
                const t1 = track.globalToLocal(to)
                const iterator = track.querySections(t0, t1)
                while (iterator.hasNext()) {
                    const result: QueryResult = iterator.next()
                    this.voiceManager.stopByIndex(trackIndex)
                    if (result.edge === Edge.Start) {
                        let frameIndex: number = barsToNumFrames(track.localToGlobal(result.position) - from, bpm, sampleRate) | 0
                        if (0 > frameIndex || frameIndex >= RENDER_QUANTUM) {
                            if (Math.abs(t1 - t0) < 1e-10) {
                                console.warn(`clamp frameIndex(${frameIndex}) while abs(t1 - t0) = ${Math.abs(t1 - t0)} < 1e-10`)
                                frameIndex = 0 | 0
                            } else {
                                throw new Error(`frameIndex(${frameIndex}), t0: ${t0}, t1: ${t1}, td: ${t1 - t0}, 
                                p: ${result.position}, frameIndexAsNum: ${(track.localToGlobal(result.position) - from)}`)
                            }
                        }
                        const sound = track.sound.get()
                        let voice: Voice
                        if (sound instanceof SamplePlayerSettings) {
                            const key: number = this.sampleRepository.modulo(this.ranIntMap[trackIndex * track.segments.get() + result.index])
                            const sample = this.sampleRepository.get(key)
                            console.assert(sample !== undefined)
                            voice = new SampleVoice(frameIndex, trackIndex, result.index, track, sample, 0)
                        } else if (sound instanceof OscillatorSettings) {
                            voice = new OscillatorVoice(frameIndex, trackIndex, result.index, track)
                        } else {
                            throw new Error("Unknown SoundSettings")
                        }
                        this.voiceManager.add(trackIndex, voice)
                    }
                }
            }
            this.barPosition = to
        }
    }
)