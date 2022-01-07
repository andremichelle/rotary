import { JsRandom } from "../lib/math.js";
registerProcessor("rotary", class extends AudioWorkletProcessor {
    constructor() {
        super();
        this.phase = 0.0;
        this.port.onmessage = (event) => {
            console.log(event);
        };
        console.log(JsRandom.Instance);
    }
    process(inputs, outputs, parameters) {
        const out = outputs[0][0];
        for (let i = 0; i < out.length; i++) {
            out[i] = Math.sin(this.phase * 2.0 * Math.PI) * 0.1;
            this.phase += 220.0 / sampleRate;
        }
        return true;
    }
});
//# sourceMappingURL=rotary.js.map