import { RotaryFormat } from "../model.js";
export declare type MessageToProcessor = UpdateFormatMessage | UploadSampleMessage;
export declare class UpdateFormatMessage {
    readonly format: RotaryFormat;
    readonly version: number;
    readonly type = "format";
    constructor(format: RotaryFormat, version: number);
}
export declare class UploadSampleMessage {
    readonly key: number;
    readonly sample: Float32Array[];
    readonly loop: boolean;
    static from(key: number, buffer: AudioBuffer, loop: boolean): UploadSampleMessage;
    readonly type = "sample";
    constructor(key: number, sample: Float32Array[], loop: boolean);
}
