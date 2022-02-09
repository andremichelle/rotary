import {RotaryFormat} from "../model.js"

export type MessageToProcessor = UpdateFormatMessage | UploadSampleMessage
export type UpdateFormatMessage = { type: "update-format", format: RotaryFormat, version: number }
export type UploadSampleMessage = { type: "upload-sample", key: number, frames: Float32Array[], numFrames: number, loop: boolean }
