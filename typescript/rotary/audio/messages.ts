import {RotaryFormat} from "../model/rotary.js"

export type MessageToProcessor = UpdateFormatMessage | UploadSampleMessage
export type UpdateFormatMessage = { type: "update-format", format: RotaryFormat, version: number }
export type UploadSampleMessage = { type: "upload-sample", key: number, frames: Float32Array[], numFrames: number, loop: boolean }

export type MessageToWorklet = UpdateCursorMessage | FormatUpdatedMessage
export type UpdateCursorMessage = { type: "update-cursor", position: number }
export type FormatUpdatedMessage = { type: "format-updated", version: number }