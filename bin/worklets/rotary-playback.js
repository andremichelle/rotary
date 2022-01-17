import { RotaryModel } from "../rotary/model.js";
class Voice {
    constructor() {
        this.phase = 0.0;
    }
}
registerProcessor("rotary-playback", class extends AudioWorkletProcessor {
    constructor() {
        super();
        this.model = new RotaryModel();
        this.loopInSeconds = 1.0;
        this.phase = 0.0;
        this.lastValues = new Float32Array(RotaryModel.MAX_TRACKS).fill(Number.MAX_VALUE);
        this.port.onmessage = (event) => {
            const data = event.data;
            if (data.type === "format") {
                this.model.deserialize(data.format);
            }
            else if (data.type === "loop-duration") {
                this.loopInSeconds = data.seconds;
            }
        };
    }
    process(inputs, outputs) {
        const tracks = this.model.tracks;
        const phaseIncr = 1.0 / sampleRate;
        for (let frameIndex = 0; frameIndex < 128; frameIndex++) {
            const localPhase = this.phase / this.loopInSeconds;
            for (let trackIndex = 0; trackIndex < tracks.size(); trackIndex++) {
                const track = tracks.get(trackIndex);
                const x = track.ratio(localPhase);
                const f = x - Math.floor(x);
                const dx = this.lastValues[trackIndex] - f;
                if (dx < 0.0) {
                    const segmentIndex = track.index(localPhase);
                }
                this.lastValues[trackIndex] = f;
            }
            this.phase += phaseIncr;
        }
        return true;
    }
});
//# sourceMappingURL=rotary-playback.js.map