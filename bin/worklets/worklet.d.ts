import { RotaryFormat } from "../rotary/model.js";
export declare type Message = UpdateFormatMessage | UpdateSampleMessage;
export declare class UpdateFormatMessage {
    readonly format: RotaryFormat;
    readonly type = "format";
    constructor(format: RotaryFormat);
}
export declare class UpdateSampleMessage {
    readonly key: number;
    readonly sample: Float32Array[];
    readonly loop: boolean;
    static from(key: number, buffer: AudioBuffer, loop: boolean): UpdateSampleMessage;
    readonly type = "sample";
    constructor(key: number, sample: Float32Array[], loop: boolean);
}
