"use strict";
registerProcessor("rotary-sample", class extends AudioWorkletProcessor {
    constructor() {
        super();
        this.sample = null;
        this.numTracks = 0 | 0;
        this.numFrames = 0 | 0;
        this.position = 0 | 0;
        this.chunkLength = 0 | 0;
        this.port.onmessage = event => {
            const data = event.data;
            if (data.action === "numTracks") {
                this.numTracks = data.value;
            }
            else if (data.action === "sample") {
                this.sample = data.sample;
                this.numFrames = data.numFrames;
                this.chunkLength = Math.floor(this.numFrames / 16);
            }
        };
    }
    process(inputs, outputs) {
        const outL = outputs[0][0];
        const outR = outputs[0][1];
        const inputChannels = inputs[0];
        for (let frameIndex = 0; frameIndex < 128; frameIndex++) {
            let l = 0.0;
            let r = 0.0;
            const numChannels = Math.min(inputChannels.length, this.numTracks);
            const env = Math.min(1.0, Math.min(this.position / 128, (this.chunkLength - this.position) / 128));
            for (let channelIndex = 0; channelIndex < numChannels; channelIndex++) {
                const f = inputChannels[channelIndex][frameIndex] * env;
                l += this.sample[0][this.position + channelIndex * this.chunkLength] * f;
                r += this.sample[1][this.position + channelIndex * this.chunkLength] * f;
            }
            outL[frameIndex] = l * 0.5;
            outR[frameIndex] = r * 0.5;
            if (++this.position >= this.chunkLength)
                this.position = 0 | 0;
        }
        return true;
    }
});
//# sourceMappingURL=rotary-sample.js.map