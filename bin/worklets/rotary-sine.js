import { DSP } from "../lib/dsp.js";
import { RotaryModel } from "../rotary/model.js";
registerProcessor("rotary-sine", class extends AudioWorkletProcessor {
    constructor() {
        super();
        this.phaseIncrements = new Float32Array(RotaryModel.MAX_TRACKS);
        this.phase = 0.0;
        const notes = new Uint8Array([60, 62, 65, 67, 69]);
        for (let i = 0; i < RotaryModel.MAX_TRACKS; i++) {
            const o = Math.floor(i / notes.length) - 1;
            const n = i % notes.length;
            this.phaseIncrements[i] = DSP.midiToHz(notes[n] + o * 12) * 2.0 * Math.PI;
        }
    }
    process(inputs, outputs) {
        const outputFrames = outputs[0][0];
        const inputChannels = inputs[0];
        const phaseIncr = 1.0 / sampleRate;
        for (let frameIndex = 0; frameIndex < outputFrames.length; frameIndex++) {
            let amp = 0.0;
            for (let channelIndex = 0; channelIndex < inputChannels.length; channelIndex++) {
                amp += Math.sin(this.phase * this.phaseIncrements[channelIndex]) * inputChannels[channelIndex][frameIndex];
            }
            outputFrames[frameIndex] = amp * 0.03;
            this.phase += phaseIncr;
        }
        return true;
    }
});
//# sourceMappingURL=rotary-sine.js.map