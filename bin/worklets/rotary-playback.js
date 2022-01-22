import { RotaryModel } from "../rotary/model.js";
import { RenderQuantum } from "../dsp/common.js";
class Voice {
    constructor(position = 0 | 0) {
        this.position = position;
    }
}
registerProcessor("rotary-playback", class extends AudioWorkletProcessor {
    constructor() {
        super();
        this.model = new RotaryModel();
        this.loopInSeconds = 1.0;
        this.phase = 0.0;
        this.sample = null;
        this.voices = [];
        this.port.onmessage = (event) => {
            const msg = event.data;
            if (msg.type === "format") {
                this.model.deserialize(msg.format);
            }
            else if (msg.type === "loop-duration") {
                this.loopInSeconds = msg.seconds;
            }
            else if (msg.type === "sample") {
                this.sample = msg.sample;
            }
        };
    }
    process(inputs, outputs) {
        const output = outputs[0];
        const outL = output[0];
        const outR = output[1];
        const tracks = this.model.tracks;
        const loopInFrames = sampleRate * this.loopInSeconds;
        for (let trackIndex = 0; trackIndex < tracks.size(); trackIndex++) {
            const track = tracks.get(trackIndex);
        }
        for (let frameIndex = 0; frameIndex < RenderQuantum; frameIndex++) {
            let l = 0.0;
            let r = 0.0;
            for (let i = this.voices.length - 1; i >= 0; i--) {
                const voice = this.voices[i];
                const position = voice.position++;
                if (position >= this.sample[0].length) {
                    this.voices.splice(i, 1);
                }
                else if (position >= 0) {
                    l += this.sample[0][position];
                    r += this.sample[1][position];
                }
            }
            outL[frameIndex] = l * 0.3;
            outR[frameIndex] = r * 0.3;
        }
        this.phase += RenderQuantum / loopInFrames;
        this.phase -= Math.floor(this.phase);
        return true;
    }
});
//# sourceMappingURL=rotary-playback.js.map