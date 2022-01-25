import { Edge, RotaryModel } from "../rotary/model.js";
import { RenderQuantum } from "../dsp/common.js";
class Voice {
    constructor(sampleKey, position = 0 | 0) {
        this.sampleKey = sampleKey;
        this.position = position;
        this.duration = Number.MAX_SAFE_INTEGER;
    }
    stop() {
        if (this.duration > Voice.RELEASE) {
            this.duration = Voice.RELEASE;
        }
    }
}
Voice.ATTACK = (0.005 * sampleRate) | 0;
Voice.RELEASE = (1.5 * sampleRate) | 0;
class Sample {
    constructor(frames, loop) {
        this.frames = frames;
        this.loop = loop;
    }
}
registerProcessor("rotary-playback", class extends AudioWorkletProcessor {
    constructor() {
        super();
        this.model = new RotaryModel();
        this.phase = 0 | 0;
        this.samples = new Map();
        this.activeVoices = new Map();
        this.port.onmessage = (event) => {
            const msg = event.data;
            if (msg.type === "format") {
                this.model.deserialize(msg.format);
            }
            else if (msg.type === "sample") {
                this.samples.set(msg.key, new Sample(msg.sample, msg.loop));
            }
        };
        for (let index = 0; index < RotaryModel.MAX_TRACKS; index++) {
            this.activeVoices.set(index, []);
        }
    }
    process(inputs, outputs) {
        const output = outputs[0];
        const outL = output[0];
        const outR = output[1];
        const tracks = this.model.tracks;
        const loopLength = (sampleRate * this.model.loopDuration.get()) | 0;
        const x0 = this.phase / loopLength;
        const x1 = (this.phase + RenderQuantum) / loopLength;
        for (let trackIndex = 0; trackIndex < tracks.size(); trackIndex++) {
            const track = tracks.get(trackIndex);
            const t0 = track.globalToLocal(x0);
            const t1 = track.globalToLocal(x1);
            const iterator = track.filterSections(t0, t1);
            while (iterator.hasNext()) {
                const result = iterator.next();
                const running = this.activeVoices.get(trackIndex);
                running.forEach(v => v.stop());
                if (result.edge === Edge.Start) {
                    const frameIndex = ((track.localToGlobal(result.position) * loopLength - this.phase)) | 0;
                    if (0 > frameIndex || frameIndex >= RenderQuantum) {
                        throw new Error(`frameIndex(${frameIndex}), t0: ${t0}, t1: ${t1}, p: ${result.position}, 
                                frameIndexAsNumber: ${(track.localToGlobal(result.position) * loopLength - this.phase)}`);
                    }
                    const num = 24;
                    const key = trackIndex % num;
                    this.activeVoices.get(trackIndex).push(new Voice(key, -frameIndex));
                }
            }
        }
        for (let voices of this.activeVoices.values()) {
            for (let i = 0; i < voices.length; i++) {
                const voice = voices[i];
                const sample = this.samples.get(voice.sampleKey);
                if (sample === undefined)
                    continue;
                const frames = sample.frames;
                for (let frameIndex = 0; frameIndex < RenderQuantum; frameIndex++) {
                    const numFrames = frames[0].length;
                    let position = voice.position++;
                    if ((!sample.loop && position >= numFrames) || 0 === voice.duration) {
                        voices.splice(i, 1);
                    }
                    else if (position >= 0) {
                        let envelope = Math.min(1.0, voice.duration-- / Voice.RELEASE) * Math.min(1.0, position / Voice.ATTACK);
                        envelope *= envelope;
                        if (sample.loop) {
                            position %= numFrames;
                        }
                        outL[frameIndex] += frames[0][position] * envelope;
                        outR[frameIndex] += frames[1][position] * envelope;
                    }
                }
            }
        }
        this.phase += RenderQuantum;
        this.phase %= loopLength;
        return true;
    }
});
//# sourceMappingURL=playback.js.map