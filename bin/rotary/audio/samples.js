import { RENDER_QUANTUM } from "../../audio/common.js";
export class Sample {
    constructor(frames, numFrames, loop) {
        this.frames = frames;
        this.numFrames = numFrames;
        this.loop = loop;
    }
}
export class SampleRepository {
    constructor() {
        this.map = new Map();
        this.maxKey = 0 | 0;
    }
    set(key, sample) {
        this.map.set(key, sample);
        this.maxKey = Math.max(key, this.maxKey);
    }
    get(key) {
        return this.map.get(key);
    }
    modulo(index) {
        return index % this.maxKey;
    }
}
export class SampleVoice {
    constructor(startFrameIndex, outputIndex, track, sample, position = 0 | 0) {
        this.startFrameIndex = startFrameIndex;
        this.outputIndex = outputIndex;
        this.track = track;
        this.sample = sample;
        this.position = position;
        this.duration = Number.MAX_SAFE_INTEGER;
    }
    process(outputs) {
        const [outL, outR] = outputs[this.outputIndex];
        const sample = this.sample;
        const [ch0, ch1] = sample.frames;
        for (let frameIndex = this.startFrameIndex; frameIndex < RENDER_QUANTUM; frameIndex++) {
            const position = this.position++;
            const duration = this.duration--;
            const numFrames = sample.numFrames;
            if (0 === duration || (!sample.loop && position >= numFrames)) {
                return true;
            }
            else {
                const envelope = Math.min(1.0, duration / SampleVoice.RELEASE) * Math.min(1.0, position / SampleVoice.ATTACK);
                if (sample.loop) {
                    outL[frameIndex] += ch0[position % numFrames] * envelope;
                    outR[frameIndex] += ch1[position % numFrames] * envelope;
                }
                else {
                    outL[frameIndex] += ch0[position] * envelope;
                    outR[frameIndex] += ch1[position] * envelope;
                }
            }
        }
        this.startFrameIndex = 0;
        return false;
    }
    stop() {
        if (this.duration > SampleVoice.RELEASE) {
            this.duration = SampleVoice.RELEASE;
        }
    }
}
SampleVoice.ATTACK = (0.010 * sampleRate) | 0;
SampleVoice.RELEASE = (0.050 * sampleRate) | 0;
//# sourceMappingURL=samples.js.map