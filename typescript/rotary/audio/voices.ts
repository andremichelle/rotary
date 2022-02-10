import {RotaryModel, RotaryTrackModel} from "../model.js"

export abstract class Voice {
    protected constructor(protected startFrame: number,
                          protected readonly trackIndex: number,
                          protected readonly segmentIndex: number,
                          protected readonly track: RotaryTrackModel) {
    }

    abstract process(outputs: Float32Array[][], positions: Float32Array): boolean

    abstract stop()
}

export class VoiceManager {
    private readonly voices: Map<number, Voice[]> = new Map()

    constructor() {
        for (let index = 0; index < RotaryModel.MAX_TRACKS; index++) {
            this.voices.set(index, [])
        }
    }

    add(index: number, voice: Voice): void {
        this.voices.get(index).push(voice)
    }

    stopAll(): void {
        this.voices.forEach(voices => voices.forEach(voice => voice.stop()))
    }

    stopByIndex(index: number): void {
        this.voices.get(index).forEach(voice => voice.stop())
    }

    process(outputs: Float32Array[][], positions: Float32Array) {
        for (let index = 0; index < RotaryModel.MAX_TRACKS; index++) {
            const voices = this.voices.get(index)
            for (let voiceIndex = voices.length - 1; 0 <= voiceIndex; voiceIndex--) {
                const voice: Voice = voices[voiceIndex]
                const complete = voice.process(outputs, positions)
                if (complete) {
                    voices.splice(voiceIndex, 1)
                }
            }
        }
    }
}