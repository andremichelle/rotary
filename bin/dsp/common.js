const LogDb = Math.log(10.0) / 20.0;
export const RenderQuantum = 128 | 0;
export const midiToHz = (note = 60.0, baseFrequency = 440.0) => baseFrequency * Math.pow(2.0, (note + 3.0) / 12.0 - 6.0);
export const dbToGain = (db) => Math.exp(db * LogDb);
export const gainToDb = (gain) => Math.log(gain) / LogDb;
export const numFramesToBars = (numFrames, bpm, samplingRate) => (numFrames * bpm) / (samplingRate * 240.0);
export const barsToNumFrames = (bars, bpm, samplingRate) => (bars * samplingRate * 240.0) / bpm;
export const barsToSeconds = (bars, bpm) => (bars * 240.0) / bpm;
export const normalize = (channels, threshold = 1.0) => {
    let max = 0.0;
    for (let channelIndex = 0; channelIndex < channels.length; channelIndex++) {
        const frames = channels[channelIndex];
        for (let i = 0; i < frames.length; i++) {
            max = Math.max(max, Math.abs(frames[i]));
        }
    }
    if (max < threshold) {
        return channels;
    }
    const scale = 1.0 / max;
    for (let channelIndex = 0; channelIndex < channels.length; channelIndex++) {
        const frames = channels[channelIndex];
        for (let i = 0; i < frames.length; i++) {
            frames[i] *= scale;
        }
    }
    return channels;
};
export class RMS {
    constructor(n) {
        this.n = n;
        this.values = new Float32Array(n);
        this.inv = 1.0 / n;
        this.sum = 0.0;
        this.index = 0 | 0;
    }
    pushPop(squared) {
        this.sum -= this.values[this.index];
        this.sum += squared;
        this.values[this.index] = squared;
        if (++this.index === this.n)
            this.index = 0;
        return 0.0 >= this.sum ? 0.0 : Math.sqrt(this.sum * this.inv);
    }
    clear() {
        this.values.fill(0.0);
        this.sum = 0.0;
        this.index = 0 | 0;
    }
}
//# sourceMappingURL=common.js.map