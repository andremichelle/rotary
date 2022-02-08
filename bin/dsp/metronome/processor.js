import { barsToNumFrames, dbToGain, numFramesToBars, RENDER_QUANTUM } from "../common.js";
import { TAU } from "../../lib/math.js";
registerProcessor("metronome", class extends AudioWorkletProcessor {
    constructor() {
        super();
        this.gain = dbToGain(-9.0);
        this.scale = 1.0 / 4.0;
        this.duration = 1.0 / 0.125;
        this.barPosition = 0.0;
        this.bpm = 120.0;
        this.phase = 0.0;
        this.frequency = 440.0;
        this.port.onmessage = event => {
            const msg = event.data;
            if (msg.type === "bpm") {
                this.bpm = msg.value;
            }
        };
    }
    process(inputs, outputs) {
        const output = outputs[0][0];
        const barsIncrement = numFramesToBars(RENDER_QUANTUM, this.bpm, sampleRate);
        const b0 = this.barPosition;
        const b1 = this.barPosition + barsIncrement;
        let index = Math.floor(b0 / this.scale);
        let position = index * this.scale;
        let frame = 0 | 0;
        while (position < b1) {
            if (position >= b0) {
                frame = this.advance(output, frame, barsToNumFrames(position - b0, this.bpm, sampleRate) | 0);
                this.frequency = index % 4 === 0 ? 880.0 : 440.0;
                this.phase = 0.0;
            }
            position = ++index * this.scale;
        }
        this.advance(output, frame, RENDER_QUANTUM);
        this.barPosition = b1;
        return true;
    }
    advance(output, frame, to) {
        while (frame < to) {
            output[frame++] = Math.sin(this.phase * this.frequency * TAU)
                * (1.0 - Math.min(1.0, this.phase * this.duration)) * this.gain;
            this.phase += 1.0 / sampleRate;
        }
        return to;
    }
});
//# sourceMappingURL=processor.js.map