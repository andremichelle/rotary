// noinspection JSUnusedGlobalSymbols

const LogDb = Math.log(10.0) / 20.0

export const RenderQuantum: number = 128 | 0
export const midiToHz = (note: number = 60.0, baseFrequency: number = 440.0): number => baseFrequency * Math.pow(2.0, (note + 3.0) / 12.0 - 6.0)
export const dbToGain = (db: number): number => Math.exp(db * LogDb)
export const gainToDb = (gain: number): number => Math.log(gain) / LogDb
export const numFramesToBars = (numFrames: number, bpm: number, samplingRate: number): number => (numFrames * bpm) / (samplingRate * 240.0)
export const barsToNumFrames = (bars: number, bpm: number, samplingRate: number): number => (bars * samplingRate * 240.0) / bpm
export const barsToSeconds = (bars: number, bpm: number): number => (bars * 240.0) / bpm
export const normalize = (channels: Float32Array[], threshold: number = 1.0): Float32Array[] => {
    let max = 0.0
    for (let channelIndex = 0; channelIndex < channels.length; channelIndex++) {
        const frames = channels[channelIndex]
        for (let i = 0; i < frames.length; i++) {
            max = Math.max(max, Math.abs(frames[i]))
        }
    }
    if (max < threshold) {
        return channels
    }
    const scale = 1.0 / max
    for (let channelIndex = 0; channelIndex < channels.length; channelIndex++) {
        const frames = channels[channelIndex]
        for (let i = 0; i < frames.length; i++) {
            frames[i] *= scale
        }
    }
    return channels
}

export class RMS {
    private readonly values: Float32Array
    private readonly inv: number
    private sum: number
    private index: number

    constructor(private readonly n: number) {
        this.values = new Float32Array(n)
        this.inv = 1.0 / n
        this.sum = 0.0
        this.index = 0 | 0
    }

    pushPop(squared: number): number {
        this.sum -= this.values[this.index]
        this.sum += squared
        this.values[this.index] = squared
        if (++this.index === this.n) this.index = 0
        return 0.0 >= this.sum ? 0.0 : Math.sqrt(this.sum * this.inv)
    }

    clear(): void {
        this.values.fill(0.0)
        this.sum = 0.0
        this.index = 0 | 0
    }
}

export interface FloatAudio {
    channels: Float32Array[]
    sampleRate: number
    numFrames: number
}

export const encodeWavFloat = (audio: FloatAudio | AudioBuffer): ArrayBuffer => {
    const MAGIC_RIFF = 0x46464952
    const MAGIC_WAVE = 0x45564157
    const MAGIC_FMT = 0x20746d66
    const MAGIC_DATA = 0x61746164
    const bytesPerChannel = Float32Array.BYTES_PER_ELEMENT
    const sampleRate = audio.sampleRate

    let numFrames: number
    let numberOfChannels: number
    let channels: Float32Array[]
    if (audio instanceof AudioBuffer) {
        channels = []
        numFrames = audio.length
        numberOfChannels = audio.numberOfChannels
        for (let i = 0; i < numberOfChannels; ++i) {
            channels[i] = audio.getChannelData(i)
        }
    } else {
        channels = audio.channels
        numFrames = audio.numFrames
        numberOfChannels = audio.channels.length
    }
    const size = 44 + numFrames * numberOfChannels * bytesPerChannel
    const buf = new ArrayBuffer(size)
    const view = new DataView(buf)
    view.setUint32(0, MAGIC_RIFF, true)
    view.setUint32(4, size - 8, true)
    view.setUint32(8, MAGIC_WAVE, true)
    view.setUint32(12, MAGIC_FMT, true)
    view.setUint32(16, 16, true) // chunk length
    view.setUint16(20, 3, true) // compression
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numberOfChannels * bytesPerChannel, true)
    view.setUint16(32, numberOfChannels * bytesPerChannel, true)
    view.setUint16(34, 8 * bytesPerChannel, true)
    view.setUint32(36, MAGIC_DATA, true)
    view.setUint32(40, numberOfChannels * numFrames * bytesPerChannel, true)
    let w = 44
    for (let i = 0; i < numFrames; ++i) {
        for (let j = 0; j < numberOfChannels; ++j) {
            view.setFloat32(w, channels[j][i], true)
            w += bytesPerChannel
        }
    }
    return view.buffer
}