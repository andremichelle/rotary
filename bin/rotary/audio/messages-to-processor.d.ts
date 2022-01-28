import { RotaryFormat } from "../model.js";
export declare type MessageToProcessor = TransportMessage | RewindMessage | UpdateFormatMessage | UploadSampleMessage;
export declare class RewindMessage {
    readonly type = "rewind";
    constructor();
}
export declare class TransportMessage {
    readonly moving: boolean;
    readonly type = "transport";
    constructor(moving: boolean);
}
export declare class UpdateFormatMessage {
    readonly format: RotaryFormat;
    readonly type = "format";
    constructor(format: RotaryFormat);
}
export declare class UploadSampleMessage {
    readonly key: number;
    readonly sample: Float32Array[];
    readonly loop: boolean;
    static from(key: number, buffer: AudioBuffer, loop: boolean): UploadSampleMessage;
    readonly type = "sample";
    constructor(key: number, sample: Float32Array[], loop: boolean);
}
