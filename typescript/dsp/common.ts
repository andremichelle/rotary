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