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
export const encodeWavFloat = (audio) => {
    const MAGIC_RIFF = 0x46464952;
    const MAGIC_WAVE = 0x45564157;
    const MAGIC_FMT = 0x20746d66;
    const MAGIC_DATA = 0x61746164;
    const bytesPerChannel = Float32Array.BYTES_PER_ELEMENT;
    const sampleRate = audio.sampleRate;
    let numFrames;
    let numberOfChannels;
    let channels;
    if (audio instanceof AudioBuffer) {
        channels = [];
        numFrames = audio.length;
        numberOfChannels = audio.numberOfChannels;
        for (let i = 0; i < numberOfChannels; ++i) {
            channels[i] = audio.getChannelData(i);
        }
    }
    else {
        channels = audio.channels;
        numFrames = audio.numFrames;
        numberOfChannels = audio.channels.length;
    }
    const size = 44 + numFrames * numberOfChannels * bytesPerChannel;
    const buf = new ArrayBuffer(size);
    const view = new DataView(buf);
    view.setUint32(0, MAGIC_RIFF, true);
    view.setUint32(4, size - 8, true);
    view.setUint32(8, MAGIC_WAVE, true);
    view.setUint32(12, MAGIC_FMT, true);
    view.setUint32(16, 16, true);
    view.setUint16(20, 3, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * bytesPerChannel, true);
    view.setUint16(32, numberOfChannels * bytesPerChannel, true);
    view.setUint16(34, 8 * bytesPerChannel, true);
    view.setUint32(36, MAGIC_DATA, true);
    view.setUint32(40, numberOfChannels * numFrames * bytesPerChannel, true);
    let w = 44;
    for (let i = 0; i < numFrames; ++i) {
        for (let j = 0; j < numberOfChannels; ++j) {
            view.setFloat32(w, channels[j][i], true);
            w += bytesPerChannel;
        }
    }
    return view.buffer;
};
//# sourceMappingURL=common.js.map