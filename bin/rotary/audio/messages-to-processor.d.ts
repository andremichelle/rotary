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
