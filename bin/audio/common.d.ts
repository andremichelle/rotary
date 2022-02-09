export declare const RENDER_QUANTUM: number;
export declare const VALUE_INTERPOLATION_TIME: number;
export declare const midiToHz: (note?: number, baseFrequency?: number) => number;
export declare const dbToGain: (db: number) => number;
export declare const gainToDb: (gain: number) => number;
export declare const numFramesToBars: (numFrames: number, bpm: number, samplingRate: number) => number;
export declare const barsToNumFrames: (bars: number, bpm: number, samplingRate: number) => number;
export declare const barsToSeconds: (bars: number, bpm: number) => number;
export declare const normalize: (channels: Float32Array[], threshold?: number) => Float32Array[];
export declare class RMS {
    private readonly n;
    private readonly values;
    private readonly inv;
    private sum;
    private index;
    constructor(n: number);
    pushPop(squared: number): number;
    clear(): void;
}
export interface FloatAudio {
    channels: Float32Array[];
    sampleRate: number;
    numFrames: number;
}
export declare const encodeWavFloat: (audio: AudioBuffer | FloatAudio) => ArrayBuffer;
export declare class FFT {
    private readonly n;
    static reverse(i: number): number;
    private readonly levels;
    private readonly cosTable;
    private readonly sinTable;
    constructor(n: number);
    process(real: Float32Array, imag: Float32Array): void;
}
export declare class Window {
    static generate(type: Window.Shape, n?: number): Float32Array;
}
export declare namespace Window {
    enum Shape {
        Bartlett = 0,
        Blackman = 1,
        BlackmanHarris = 2,
        Hamming = 3,
        Hanning = 4
    }
}
export declare class Chords {
    static Major: Uint8Array;
    static Minor: Uint8Array;
    static Semitones: string[];
    static toString(midiNote: number): string;
    static toStrings(midiNotes: any): string;
    static compose(scale: Uint8Array, rootKey: number, variation: number, numKeys: number): Uint8Array;
}
