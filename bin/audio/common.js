const LogDb = Math.log(10.0) / 20.0;
export const RENDER_QUANTUM = 128 | 0;
export const DEFAULT_INTERPOLATION_TIME = 0.005;
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
export const interpolateParameterValueIfRunning = (context, audioParam, value) => {
    if (context.state === "running") {
        audioParam.value = value;
    }
    else {
        audioParam.linearRampToValueAtTime(value, context.currentTime + DEFAULT_INTERPOLATION_TIME);
    }
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
export class FFT {
    constructor(n) {
        this.n = n;
        const hn = n >> 1;
        this.levels = (32 - Math.floor(Math.log2(n))) | 0;
        this.cosTable = new Float32Array(hn);
        this.sinTable = new Float32Array(hn);
        for (let i = 0; i < hn; i++) {
            const angle = 2.0 * Math.PI * i / n;
            this.cosTable[i] = Math.cos(angle);
            this.sinTable[i] = Math.sin(angle);
        }
    }
    static reverse(i) {
        i = (i & 0x55555555) << 1 | (i >>> 1) & 0x55555555;
        i = (i & 0x33333333) << 2 | (i >>> 2) & 0x33333333;
        i = (i & 0x0f0f0f0f) << 4 | (i >>> 4) & 0x0f0f0f0f;
        i = (i << 24) | ((i & 0xff00) << 8) | ((i >>> 8) & 0xff00) | (i >>> 24);
        return i;
    }
    process(real, imag) {
        let i, j, k, temp;
        for (let i = 0 | 0; i < this.n; ++i) {
            j = FFT.reverse(i) >>> this.levels;
            if (j > i) {
                temp = real[i];
                real[i] = real[j];
                real[j] = temp;
                temp = imag[i];
                imag[i] = imag[j];
                imag[j] = temp;
            }
        }
        const cosTable = this.cosTable;
        const sinTable = this.sinTable;
        for (let size = 2 | 0; size <= this.n; size <<= 1) {
            const hs = size >> 1;
            const ts = this.n / size;
            for (i = 0 | 0; i < this.n; i += size) {
                const m = i + hs;
                for (j = i, k = 0; j < m; j++, k = (k + ts) | 0) {
                    const idx = (j + hs) | 0;
                    const cos = cosTable[k];
                    const sin = sinTable[k];
                    const reali = real[idx];
                    const imagi = imag[idx];
                    const pre = reali * cos + imagi * sin;
                    const pim = imagi * cos - reali * sin;
                    const real2 = real[j];
                    const imag2 = imag[j];
                    real[idx] = real2 - pre;
                    imag[idx] = imag2 - pim;
                    real[j] = real2 + pre;
                    imag[j] = imag2 + pim;
                }
            }
            if (size === this.n) {
                break;
            }
        }
    }
}
export class Window {
    static generate(type, n = 512 | 0) {
        const values = new Float32Array(n);
        switch (type) {
            case Window.Shape.Bartlett: {
                const n2 = (n >> 1) - 1;
                let i = 0;
                for (; i <= n2; ++i) {
                    values[i] = 2.0 * i / (n - 1.0);
                }
                for (; i < n; ++i) {
                    values[i] = 2.0 - 2.0 * i / (n - 1.0);
                }
                return values;
            }
            case Window.Shape.Blackman: {
                const a = Math.PI / (n - 1);
                const c = 2.0 * a;
                const d = 4.0 * a;
                for (let i = 0; i < n; ++i) {
                    values[i] = 0.42323 - 0.49755 * Math.cos(c * i) + 0.07922 * Math.cos(d * i);
                }
                return values;
            }
            case Window.Shape.BlackmanHarris: {
                const a = Math.PI / (n - 1);
                const c = 2.0 * a;
                const d = 4.0 * a;
                const e = 6.0 * a;
                for (let i = 0; i < n; ++i) {
                    values[i] = 0.35875 - 0.48829 * Math.cos(c * i) + 0.14128 * Math.cos(d * i) - 0.01168 * Math.cos(e * i);
                }
                return values;
            }
            case Window.Shape.Hamming: {
                const a = Math.PI / (n - 1);
                const c = 2.0 * a;
                for (let i = 0; i < n; ++i) {
                    values[i] = 0.54 - 0.46 * Math.cos(c * i);
                }
                return values;
            }
            case Window.Shape.Hanning: {
                const a = Math.PI / (n - 1);
                const c = 2.0 * a;
                for (let i = 0; i < n; ++i) {
                    values[i] = 0.5 - 0.5 * Math.cos(c * i);
                }
                return values;
            }
            default:
                throw new Error("Unknown type: " + type);
        }
    }
}
(function (Window) {
    let Shape;
    (function (Shape) {
        Shape[Shape["Bartlett"] = 0] = "Bartlett";
        Shape[Shape["Blackman"] = 1] = "Blackman";
        Shape[Shape["BlackmanHarris"] = 2] = "BlackmanHarris";
        Shape[Shape["Hamming"] = 3] = "Hamming";
        Shape[Shape["Hanning"] = 4] = "Hanning";
    })(Shape = Window.Shape || (Window.Shape = {}));
})(Window || (Window = {}));
export class Chords {
    static toString(midiNote) {
        const octave = Math.floor(midiNote / 12);
        const semitone = midiNote % 12;
        return Chords.Semitones[semitone] + (octave - 2);
    }
    static toStrings(midiNotes) {
        let result = "";
        for (let i = 0; i < midiNotes.length; ++i) {
            result += Chords.toString(midiNotes[i]);
            if (i < midiNotes.length - 1)
                result += " ";
        }
        return result;
    }
    static compose(scale, rootKey, variation, numKeys) {
        const chord = new Uint8Array(numKeys);
        for (let i = 0; i < numKeys; i++) {
            const index = variation + i * 2;
            const interval = scale[index % 7] + Math.floor(index / 7) * 12;
            chord[i] = rootKey + interval;
        }
        return chord;
    }
}
Chords.Major = new Uint8Array([0, 2, 4, 5, 7, 9, 11]);
Chords.Minor = new Uint8Array([0, 2, 3, 5, 7, 8, 10]);
Chords.Semitones = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
//# sourceMappingURL=common.js.map