import { Func } from "../lib/math.js";
import { RotaryModel } from "../rotary/model.js";
registerProcessor("rotary-automation", class extends AudioWorkletProcessor {
    constructor() {
        super();
        this.envelopes = new Float32Array(RotaryModel.MAX_TRACKS);
        this.model = new RotaryModel();
        this.coeff = NaN;
        this.phase = 0.0;
        this.tMin = 0.00;
        this.tMax = 1.00;
        this.port.onmessage = (event) => {
            const data = event.data;
            if (data.type === "format") {
                this.model.deserialize(data.format);
            }
        };
        this.updateEnvelope(0.005);
    }
    process(inputs, outputs) {
        const channels = outputs[0];
        const tracks = this.model.tracks;
        const phaseIncr = 1.0 / sampleRate;
        for (let frameIndex = 0; frameIndex < 128; frameIndex++) {
            const localPhase = this.phase / this.model.loopDuration.get();
            for (let trackIndex = 0; trackIndex < tracks.size(); trackIndex++) {
                const track = tracks.get(trackIndex);
                const x = track.localToSegment(localPhase);
                const y = Func.step(this.tMin, this.tMax, x);
                const env = this.envelopes[trackIndex];
                this.envelopes[trackIndex] = y + this.coeff * (env - y);
                channels[trackIndex][frameIndex] = env;
            }
            this.phase += phaseIncr;
        }
        return true;
    }
    updateEnvelope(seconds) {
        this.coeff = Math.exp(-1.0 / (sampleRate * seconds));
    }
});
//# sourceMappingURL=automation.js.map