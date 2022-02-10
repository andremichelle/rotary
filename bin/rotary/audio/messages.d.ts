import { RotaryFormat } from "../model.js";
export declare type MessageToProcessor = UpdateFormatMessage | UploadSampleMessage;
export declare type UpdateFormatMessage = {
    type: "update-format";
    format: RotaryFormat;
    version: number;
};
export declare type UploadSampleMessage = {
    type: "upload-sample";
    key: number;
    frames: Float32Array[];
    numFrames: number;
    loop: boolean;
};
export declare type MessageToWorklet = UpdateCursorMessage | FormatUpdatedMessage;
export declare type UpdateCursorMessage = {
    type: "update-cursor";
    position: number;
};
export declare type FormatUpdatedMessage = {
    type: "format-updated";
    version: number;
};
