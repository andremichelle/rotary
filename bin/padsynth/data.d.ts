export declare class Harmonic {
    position: number;
    level: number;
    bandWidth: number;
    static make(root: number, bandWidth?: number, bandWidthScale?: number, brightness?: number, distance?: number, numHarmonics?: number): Harmonic[];
    constructor(position: number, level: number, bandWidth: number);
}
export declare type MessageType = 'init' | 'create' | 'created';
export interface Message {
    type: MessageType;
}
export declare class InitMessage implements Message {
    readonly fftSize: number;
    readonly type = "init";
    constructor(fftSize: number);
}
export declare class CreateMessage implements Message {
    readonly harmonics: Harmonic[];
    readonly type = "create";
    constructor(harmonics: Harmonic[]);
}
export declare class CreatedMessage implements Message {
    readonly wavetable: Float32Array;
    readonly type = "created";
    constructor(wavetable: Float32Array);
}
