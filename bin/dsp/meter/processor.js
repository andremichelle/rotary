import { RENDER_QUANTUM, RMS } from "../common.js";
import { UpdateMeterMessage } from "./message.js";
import { ArrayUtils } from "../../lib/common.js";
registerProcessor("dsp-meter", class extends AudioWorkletProcessor {
    constructor(options) {
        super(options);
        this.updateCount = 0 | 0;
        this.numberOfLines = options.numberOfInputs;
        this.channelCount = options.channelCount;
        console.assert(options.numberOfOutputs === this.numberOfLines);
        this.maxPeaks = ArrayUtils.fill(this.numberOfLines, () => new Float32Array(this.channelCount));
        this.maxSquares = ArrayUtils.fill(this.numberOfLines, () => new Float32Array(this.channelCount));
        const rmsSize = sampleRate * 0.050;
        const fps = 60.0;
        this.updateRate = (sampleRate / fps) | 0;
        this.rmsChannels = ArrayUtils.fill(this.numberOfLines, () => ArrayUtils.fill(this.channelCount, () => new RMS(rmsSize)));
    }
    process(inputs, outputs) {
        for (let i = 0; i < this.numberOfLines; i++) {
            const input = inputs[i];
            const output = outputs[i];
            for (let channel = 0 | 0; channel < output.length; ++channel) {
                const inputChannel = input[channel];
                const outputChannel = output[channel];
                const rms = this.rmsChannels[i][channel];
                let maxPeak = this.maxPeaks[i][channel];
                let maxSquare = this.maxSquares[i][channel];
                if (undefined === inputChannel) {
                    this.maxPeaks[i][channel] = 0.0;
                    this.maxSquares[i][channel] = 0.0;
                }
                else {
                    for (let i = 0 | 0; i < RENDER_QUANTUM; ++i) {
                        const inp = outputChannel[i] = inputChannel[i];
                        maxPeak = Math.max(maxPeak, Math.abs(inp));
                        maxSquare = Math.max(maxSquare, rms.pushPop(inp * inp));
                    }
                    this.maxPeaks[i][channel] = maxPeak;
                    this.maxSquares[i][channel] = maxSquare;
                }
            }
        }
        this.updateCount += RENDER_QUANTUM;
        if (this.updateCount >= this.updateRate) {
            this.updateCount -= this.updateRate;
            this.port.postMessage(new UpdateMeterMessage(this.maxSquares, this.maxPeaks));
            for (let i = 0; i < this.numberOfLines; i++) {
                this.maxPeaks[i].fill(0.0);
                this.maxSquares[i].fill(0.0);
            }
        }
        return true;
    }
});
//# sourceMappingURL=processor.js.map