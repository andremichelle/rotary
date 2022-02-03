import { RENDER_QUANTUM, RMS } from "../common.js";
import { UpdateMeterMessage } from "./message.js";
registerProcessor("dsp-meter", class extends AudioWorkletProcessor {
    constructor(options) {
        super(options);
        this.maxPeaks = new Float32Array(2);
        this.maxSquares = new Float32Array(2);
        this.updateCount = 0 | 0;
        const rmsSize = sampleRate * 0.050;
        const fps = 60.0;
        this.updateRate = (sampleRate / fps) | 0;
        this.rmsChannels = [new RMS(rmsSize), new RMS(rmsSize)];
    }
    process(inputs, outputs) {
        const input = inputs[0];
        const output = outputs[0];
        for (let channel = 0 | 0; channel < output.length; ++channel) {
            const inputChannel = input[channel];
            const outputChannel = output[channel];
            const rms = this.rmsChannels[channel];
            let maxPeak = this.maxPeaks[channel];
            let maxSquare = this.maxSquares[channel];
            if (undefined === inputChannel) {
                this.maxPeaks[channel] = 0.0;
                this.maxSquares[channel] = 0.0;
            }
            else {
                for (let i = 0 | 0; i < inputChannel.length; ++i) {
                    const inp = outputChannel[i] = inputChannel[i];
                    maxPeak = Math.max(maxPeak, Math.abs(inp));
                    maxSquare = Math.max(maxSquare, rms.pushPop(inp * inp));
                }
                this.maxPeaks[channel] = maxPeak;
                this.maxSquares[channel] = maxSquare;
            }
        }
        this.updateCount += RENDER_QUANTUM;
        if (this.updateCount >= this.updateRate) {
            this.updateCount -= this.updateRate;
            this.port.postMessage(new UpdateMeterMessage(this.maxSquares, this.maxPeaks));
            for (let channel = 0 | 0; channel < 2; ++channel) {
                this.maxPeaks[channel] = 0.0;
                this.maxSquares[channel] = 0.0;
            }
        }
        return true;
    }
});
//# sourceMappingURL=processor.js.map