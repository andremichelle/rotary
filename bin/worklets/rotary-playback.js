import { RotaryModel } from "../rotary/model.js";
import { Mulberry32 } from "../lib/math.js";
import { dbToGain } from "../dsp/common.js";
class Voice {
    constructor(position = 0 | 0) {
        this.position = position;
        this.phase = 0.0;
        this.envelope = 0.0;
    }
}
registerProcessor("rotary-playback", class extends AudioWorkletProcessor {
    constructor() {
        super();
        this.model = new RotaryModel();
        this.loopInSeconds = 1.0;
        this.phase = 0.0;
        this.lastValues = new Float32Array(RotaryModel.MAX_TRACKS).fill(Number.MAX_VALUE);
        this.sample = null;
        this.voices = [];
        this.coeff = Math.exp(-1.0 / (sampleRate * 0.005));
        this.random = new Mulberry32(0xFFFF);
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
        const oneOverSampleRate = 1.0 / sampleRate;
        for (let frameIndex = 0; frameIndex < 128; frameIndex++) {
            const localPhase = this.phase / this.loopInSeconds;
            for (let trackIndex = 0; trackIndex < tracks.size(); trackIndex++) {
                const track = tracks.get(trackIndex);
                const x = track.ratio(localPhase);
                const f = x - Math.floor(x);
                const dx = (this.lastValues[trackIndex] - f);
                if (dx < 0.0) {
                    const segmentIndex = track.index(localPhase);
                    this.random.seed = 0xFFBBCC + trackIndex;
                    this.voices.push(new Voice(this.random.nextInt(0, this.sample[0].length)));
                    console.log(frameIndex, trackIndex);
                }
                this.lastValues[trackIndex] = f;
            }
            let l = 0.0;
            let r = 0.0;
            for (let i = this.voices.length - 1; i >= 0; i--) {
                const voice = this.voices[i];
                const position = voice.position++;
                const gate = voice.phase < 0.1;
                if (position >= this.sample[0].length || (!gate && voice.envelope < dbToGain(-72.0))) {
                    this.voices.splice(i, 1);
                }
                else {
                    const env = gate ? 1.0 : 0.0;
                    voice.envelope = env + this.coeff * (voice.envelope - env);
                    l += this.sample[0][position] * voice.envelope;
                    r += this.sample[1][position] * voice.envelope;
                    voice.phase += oneOverSampleRate;
                }
            }
            outL[frameIndex] = l * 0.2;
            outR[frameIndex] = r * 0.2;
            this.phase += oneOverSampleRate;
        }
        return true;
    }
});
//# sourceMappingURL=rotary-playback.js.map