import {CreatedMessage, CreateMessage, Harmonic, InitMessage} from "./data.js"
import {FFT} from "../lib/fft.js"
import {Mulberry32} from "../lib/math.js"
import {TAU} from "../lib/common.js"

export class WavetableCreator {
    static MIN_EXP = 14.71280603 // This value is the bound at which the values get too small
    static BOUND = Math.sqrt(WavetableCreator.MIN_EXP)
    static FALL_OFF = 18000.0

    static profile(fi: number, bwi: number): number {
        let x = fi / bwi
        x *= x
        return x > WavetableCreator.MIN_EXP ? 0.0 : Math.exp(-x) / bwi
    }

    private readonly fftBins: number
    private readonly sin: Float32Array
    private readonly cos: Float32Array
    private readonly profiles: Float32Array
    private readonly falloff: Float32Array
    private readonly real: Float32Array
    private readonly imag: Float32Array
    private readonly fft: FFT

    constructor(private readonly fftSize: number, private readonly sampleRate: number) {
        this.fftSize = fftSize
        this.fftBins = fftSize >> 1
        this.sin = new Float32Array(this.fftBins)
        this.cos = new Float32Array(this.fftBins)
        this.profiles = new Float32Array(this.fftBins)
        this.falloff = new Float32Array(this.fftBins)
        this.real = new Float32Array(this.fftSize)
        this.imag = new Float32Array(this.fftSize)
        this.fft = new FFT(this.fftSize)

        const random = new Mulberry32(0x91826)
        const cutIndex = Math.floor(WavetableCreator.FALL_OFF / (sampleRate / fftSize))
        const a = Math.PI / ((this.fftBins - cutIndex) * 2.0)
        for (let i = 0; i < this.fftBins; i++) {
            if (i > cutIndex) {
                const x = Math.cos((i - cutIndex) * a)
                this.falloff[i] = x * x
            } else {
                this.falloff[i] = 1.0
            }
            const phase = random.nextDouble(0.0, TAU)
            this.sin[i] = Math.sin(phase)
            this.cos[i] = Math.cos(phase)
        }
    }

    update(harmonics: Harmonic[]): Float32Array {
        const fftBins = this.fftBins
        const fftSize = this.fftSize
        const wavetable = new Float32Array(fftSize)
        const fftSizeInverse = 1.0 / fftSize
        for (let i = 0; i < harmonics.length; i++) {
            const harmonic = harmonics[i]
            const fh = harmonic.position
            const bwi = harmonic.bandWidth * 0.5
            const temp = bwi * WavetableCreator.BOUND
            const jMin = Math.max(1, -Math.floor((temp - fh) * fftSize)) | 0
            if (jMin >= fftBins) {
                continue
            }
            const lh = harmonic.level
            const jMid = Math.min(fftBins, Math.floor(fh * fftSize)) | 0
            const jMax = Math.min(fftBins, Math.ceil((temp + fh) * fftSize)) | 0
            let j = jMin
            for (; j < jMid; j++) { // left half of the bell curve
                this.profiles[j] += WavetableCreator.profile(j * fftSizeInverse - fh, bwi) * lh
            }
            if (jMid < jMax) {
                this.profiles[jMid] += WavetableCreator.profile(0.0, bwi) * lh // peak of the bell curve
                for (; j < jMax; j++) { // right half of the bell curve
                    this.profiles[j] += WavetableCreator.profile(j * fftSizeInverse - fh, bwi) * lh
                }
            }
        }
        for (let i = 0; i < fftBins; i++) {
            const profile = this.profiles[i] * this.falloff[i]
            this.real[i] = profile * this.sin[i]
            this.imag[i] = profile * this.cos[i]
            this.profiles[i] = 0.0
        }
        this.fft.process(this.imag, this.real)
        let max = 0.0
        for (let i = 0; i < fftSize; i++) {
            const amplitude = this.real[i]
            if (max < Math.abs(amplitude)) {
                max = Math.abs(amplitude)
            }
            wavetable[i] = amplitude
            this.real[i] = 0.0
            this.imag[i] = 0.0
        }
        const scale = 1.0 / (max * Math.sqrt(2.0))
        for (let j = 0; j < fftSize; j++) {
            wavetable[j] *= scale
        }
        return wavetable
    }
}

declare interface Self {
    postMessage(message: any, transfer?: Transferable[]): void
}

let creator = null
const me = (self as unknown as Self)
onmessage = event => {
    const data = event.data as (InitMessage | CreateMessage)
    switch (data.type) {
        case "init": {
            creator = new WavetableCreator(data.fftSize, data.sampleRate)
            break
        }
        case "create": {
            console.assert(null !== creator)
            me.postMessage(new CreatedMessage(creator.update(data.harmonics)))
            break
        }
    }
}