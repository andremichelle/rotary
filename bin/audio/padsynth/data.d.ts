export declare class Harmonic {
    position: number;
    level: number;
    bandWidth: number;
    static make(hz: number, bandWidth?: number, bandWidthScale?: number, brightness?: number, distance?: number, numHarmonics?: number): Harmonic[];
    constructor(position: number, level: number, bandWidth: number);
}
export declare type Message = {
    type: "init";
    fftSize: number;
    sampleRate: number;
} | {
    type: "create";
    harmonics: Harmonic[];
} | {
    type: "created";
    wavetable: Float32Array;
};
