export type MessageToWorklet = UpdateCursorMessage | FormatUpdatedMessage
export type UpdateCursorMessage = { type: "update-cursor", position: number }
export type FormatUpdatedMessage = { type: "format-updated", version: number }