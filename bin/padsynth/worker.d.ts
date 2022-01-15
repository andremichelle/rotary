import { Harmonic } from "./data.js";
export declare class WavetableCreator {
    private readonly fftSize;
    static MIN_EXP: number;
    static BOUND: number;
    static profile(fi: number, bwi: number): number;
    private readonly fftBins;
    private readonly sin;
    private readonly cos;
    private readonly profiles;
    private readonly real;
    private readonly imag;
    private readonly fft;
    constructor(fftSize: number);
    update(harmonics: Harmonic[]): Float32Array;
}
