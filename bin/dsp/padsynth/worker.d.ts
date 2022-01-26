import { Harmonic } from "./data.js";
export declare class WavetableCreator {
    private readonly fftSize;
    private readonly sampleRate;
    static MIN_EXP: number;
    static BOUND: number;
    static FALL_OFF: number;
    static profile(fi: number, bwi: number): number;
    private readonly fftBins;
    private readonly sin;
    private readonly cos;
    private readonly profiles;
    private readonly falloff;
    private readonly real;
    private readonly imag;
    private readonly fft;
    constructor(fftSize: number, sampleRate: number);
    update(harmonics: Harmonic[]): Float32Array;
}
