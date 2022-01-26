export declare const RenderQuantum: number;
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
