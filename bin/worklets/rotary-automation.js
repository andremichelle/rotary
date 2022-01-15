import { Function } from "../lib/math.js";
import { RotaryModel } from "../rotary/model.js";
registerProcessor("rotary-automation", class extends AudioWorkletProcessor {
    constructor() {
        super();
        this.envelopes = new Float32Array(RotaryModel.MAX_TRACKS);
        this.model = new RotaryModel();
        this.loopInSeconds = 1.0;
        this.coeff = 0.0;
        this.phase = 0.0;
        this.tMin = 0.00;
        this.tMax = 1.00;
        this.port.onmessage = (event) => {
            const data = event.data;
            if (data.action === "format") {
                this.model.deserialize(data.value);
            }
            else if (data.action === "loopInSeconds") {
                this.loopInSeconds = data.value;
            }
            else if (data.action === "envelope") {
                this.updateEnvelope(data.value);
            }
            else if (data.action === "edge") {
                this.tMin = data.value[0];
                this.tMax = data.value[1];
            }
        };
        this.updateEnvelope(0.005);
    }
    process(inputs, outputs) {
        const channels = outputs[0];
        const tracks = this.model.tracks;
        const phaseIncr = 1.0 / sampleRate;
        for (let frameIndex = 0; frameIndex < 128; frameIndex++) {
            const localPhase = this.phase / this.loopInSeconds;
            for (let trackIndex = 0; trackIndex < tracks.size(); trackIndex++) {
                const track = tracks.get(trackIndex);
                const x = track.ratio(localPhase);
                const y = Function.step(this.tMin, this.tMax, x);
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
//# sourceMappingURL=rotary-automation.js.map