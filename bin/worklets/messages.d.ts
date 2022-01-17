import { RotaryFormat } from "../rotary/model.js";
export declare type Message = UpdateFormatMessage | UpdateLoopDurationMessage;
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
