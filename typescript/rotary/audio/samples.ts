import {Voice} from "./voices.js"
import {RENDER_QUANTUM} from "../../audio/common.js"
import {RotaryTrackModel} from "../model.js"

export class Sample {
    constructor(readonly frames: Float32Array[], readonly numFrames: number, readonly loop: boolean) {
    }
}

export class SampleRepository {
    private readonly map: Map<number, Sample> = new Map()

    private maxKey: number = 0 | 0

    constructor() {
    }

    set(key: number, sample: Sample): void {
        this.map.set(key, sample)
        this.maxKey = Math.max(key, this.maxKey)
    }

    get(key: number): Sample {
        return this.map.get(key)
    }

    modulo(index: number): number {
        return index % this.maxKey
    }
}

export class SampleVoice implements Voice {
    static ATTACK = (0.010 * sampleRate) | 0
    static RELEASE = (0.050 * sampleRate) | 0

    duration: number = Number.MAX_SAFE_INTEGER

    constructor(private startFrameIndex: number,
                private readonly outputIndex: number,
                private readonly track: RotaryTrackModel,
                private readonly sample: Sample,
                private position: number = 0 | 0) {
    }

    process(outputs: Float32Array[][]): boolean {
        const [outL, outR] = outputs[this.outputIndex]
        const sample: Sample = this.sample
        const [ch0, ch1] = sample.frames
        for (let frameIndex = this.startFrameIndex; frameIndex < RENDER_QUANTUM; frameIndex++) {
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
        this.startFrameIndex = 0
        return false
    }

    stop() {
        if (this.duration > SampleVoice.RELEASE) {
            this.duration = SampleVoice.RELEASE
        }
    }
}