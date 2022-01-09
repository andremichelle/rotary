import { RotaryModel } from "../rotary/model.js";
import { DSP } from "../lib/dsp.js";
class Rotary extends AudioWorkletProcessor {
    constructor() {
        super();
        this.model = new RotaryModel();
        this.phaseIncrements = new Float32Array(Rotary.MAX_NOTES);
        this.envelopes = new Float32Array(Rotary.MAX_NOTES);
        this.coeff = 0.0;
        this.phase = 0.0;
        this.loopInSeconds = 1.0;
        const notes = new Uint8Array([60, 62, 65, 67, 69]);
        for (let i = 0; i < Rotary.MAX_NOTES; i++) {
            const o = Math.floor(i / notes.length) - 1;
            const n = i % notes.length;
            this.phaseIncrements[i] = DSP.midiToHz(notes[n] + o * 12) * 2.0 * Math.PI;
        }
        const time = .005;
        this.coeff = Math.exp(-1.0 / (sampleRate * time));
        this.port.onmessage = (event) => {
            const data = event.data;
            if (data.action === "format") {
                this.model.deserialize(data.value);
            }
            else if (data.action === "loopInSeconds") {
                this.loopInSeconds = data.value;
            }
        };
    }
    process(inputs, outputs, parameters) {
        const out = outputs[0][0];
        const tracks = this.model.tracks;
        const localPhase = this.phase / this.loopInSeconds;
        for (let i = 0; i < out.length; i++) {
            let amp = 0.0;
            tracks.forEach((track, index) => {
                if (index >= Rotary.MAX_NOTES)
                    return;
                const level = track.ratio(localPhase);
                const env = this.envelopes[index];
                this.envelopes[index] = level + this.coeff * (env - level);
                amp += Math.sin(this.phase * this.phaseIncrements[index]) * env;
            });
            out[i] = amp * 0.03;
            this.phase += 1.0 / sampleRate;
        }
        return true;
    }
}
Rotary.MAX_NOTES = 32;
registerProcessor("rotary", Rotary);
//# sourceMappingURL=rotary.js.map