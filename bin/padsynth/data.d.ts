export declare class Harmonic {
    position: number;
    level: number;
    bandWidth: number;
    static make(root: number, bandWidth?: number, bandWidthScale?: number, brightness?: number, distance?: number, numHarmonics?: number): Harmonic[];
    constructor(position: number, level: number, bandWidth: number);
}
export declare type Message = InitMessage | CreateMessage | CreatedMessage;
export declare class InitMessage {
    readonly fftSize: number;
    readonly sampleRate: number;
    readonly type = "init";
    constructor(fftSize: number, sampleRate: number);
}
export declare class CreateMessage {
    readonly harmonics: Harmonic[];
    readonly type = "create";
    constructor(harmonics: Harmonic[]);
}
export declare class CreatedMessage {
    readonly wavetable: Float32Array;
    readonly type = "created";
    constructor(wavetable: Float32Array);
}
