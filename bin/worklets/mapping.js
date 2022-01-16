import { Exp } from "../lib/mapping.js";
registerProcessor("mapping", class extends AudioWorkletProcessor {
    constructor() {
        super();
        this.mapping = new Exp(240.0, 12000.0);
    }
    process(inputs, outputs) {
        const input = inputs[0];
        const output = outputs[0];
        const numChannels = Math.min(output.length, input.length);
        for (let channelIndex = 0; channelIndex < numChannels; channelIndex++) {
            const inp = input[channelIndex];
            const out = output[channelIndex];
            for (let i = 0; i < 128; i++) {
                const x = inp[i];
                out[i] = this.mapping.y(Math.pow(Math.sin(x * Math.PI), 8.0));
            }
        }
        return true;
    }
});
//# sourceMappingURL=mapping.js.map