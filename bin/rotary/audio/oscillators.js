import { Voice } from "./voices.js";
import { Chords, midiToHz, RENDER_QUANTUM } from "../../audio/common.js";
import { TAU } from "../../lib/math.js";
export class OscillatorVoice extends Voice {
    constructor(startFrame, trackIndex, segmentIndex, track) {
        super(startFrame, trackIndex, segmentIndex, track);
        this.position = 0 | 0;
        this.duration = Number.MAX_SAFE_INTEGER;
        const compose = Chords.compose(Chords.Minor, 60, 1, 5);
        const o = Math.floor(segmentIndex / compose.length) * 12;
        const n = segmentIndex % compose.length;
        this.frequency = midiToHz(compose[n] + o);
    }
    process(outputs, positions) {
        const [outL, outR] = outputs[this.trackIndex];
        const sampleRateInv = 1.0 / sampleRate;
        for (let frameIndex = this.startFrame; frameIndex < RENDER_QUANTUM; frameIndex++) {
            const position = ++this.position;
            const duration = --this.duration;
            if (0 === duration) {
                return true;
            }
            const envelope = Math.min(OscillatorVoice.ENVELOPE_TIME, Math.min(position, duration)) * OscillatorVoice.ENVELOPE_TIME_INV * 0.2;
            const x = position * sampleRateInv;
            const out = Math.sin(x * (this.frequency * Math.pow(2.0, 0.0)) * TAU) * envelope;
            outL[frameIndex] += out;
            outR[frameIndex] += out;
        }
        this.startFrame = 0;
        return false;
    }
    stop() {
        if (this.duration > OscillatorVoice.ENVELOPE_TIME) {
            this.duration = OscillatorVoice.ENVELOPE_TIME;
        }
    }
}
OscillatorVoice.ENVELOPE_TIME = (0.010 * sampleRate) | 0;
OscillatorVoice.ENVELOPE_TIME_INV = 1.0 / OscillatorVoice.ENVELOPE_TIME;
//# sourceMappingURL=oscillators.js.map