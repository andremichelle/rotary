import { Edge, RotaryModel } from "../rotary/model.js";
import { RenderQuantum } from "../dsp/common.js";
class Voice {
    constructor(sampleKey, position = 0 | 0) {
        this.sampleKey = sampleKey;
        this.position = position;
    }
}
registerProcessor("rotary-playback", class extends AudioWorkletProcessor {
    constructor() {
        super();
        this.model = new RotaryModel();
        this.phase = 0.0;
        this.samples = new Map();
        this.voices = [];
        this.port.onmessage = (event) => {
            const msg = event.data;
            if (msg.type === "format") {
                this.model.deserialize(msg.format);
            }
            else if (msg.type === "sample") {
                this.samples.set(msg.key, msg.sample);
            }
        };
    }
    process(inputs, outputs) {
        const output = outputs[0];
        const outL = output[0];
        const outR = output[1];
        const tracks = this.model.tracks;
        const loopInFrames = sampleRate * this.model.loopDuration.get();
        for (let trackIndex = 0; trackIndex < tracks.size(); trackIndex++) {
            const track = tracks.get(trackIndex);
            const t0 = track.translatePhase(this.phase);
            const t1 = track.translatePhase(this.phase + RenderQuantum / loopInFrames);
            const iterator = track.filterSections(t0, t1);
            while (iterator.hasNext()) {
                const result = iterator.next();
                if (result.edge === Edge.Max) {
                    continue;
                }
                const frameIndex = Math.floor((track.inversePhase(result.position) - this.phase) * loopInFrames);
                console.assert(0 <= frameIndex && frameIndex < RenderQuantum, "out of bounds");
                const key = trackIndex % 9;
                this.voices.push(new Voice(key, -frameIndex));
            }
        }
        for (let frameIndex = 0; frameIndex < RenderQuantum; frameIndex++) {
            let l = 0.0;
            let r = 0.0;
            for (let i = this.voices.length - 1; i >= 0; i--) {
                const voice = this.voices[i];
                const position = voice.position++;
                const sample = this.samples.get(voice.sampleKey);
                if (sample === undefined)
                    continue;
                if (position >= sample[0].length) {
                    this.voices.splice(i, 1);
                }
                else if (position >= 0) {
                    l += sample[0][position];
                    r += sample[1][position];
                }
            }
            outL[frameIndex] = l;
            outR[frameIndex] = r;
        }
        this.phase += RenderQuantum / loopInFrames;
        this.phase -= Math.floor(this.phase);
        return true;
    }
});
//# sourceMappingURL=rotary-playback.js.map