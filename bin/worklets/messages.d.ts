import { RotaryFormat } from "../rotary/model.js";
export declare type Message = UpdateFormatMessage | UpdateLoopDurationMessage | UpdateSampleMessage;
export declare class UpdateFormatMessage {
    readonly format: RotaryFormat;
    readonly type = "format";
    constructor(format: RotaryFormat);
}
export declare class UpdateLoopDurationMessage {
    readonly seconds: number;
    readonly type = "loop-duration";
    constructor(seconds: number);
}
export declare class UpdateSampleMessage {
    readonly sample: Float32Array[];
    static from(buffer: AudioBuffer): UpdateSampleMessage;
    readonly type = "sample";
    constructor(sample: Float32Array[]);
}
