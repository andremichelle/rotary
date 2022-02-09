export type MessageToWorklet = UpdateCursorMessage | FormatUpdatedMessage

export class UpdateCursorMessage {
    readonly type = 'phase'

    constructor(readonly phase: number) {
    }
}

export class FormatUpdatedMessage {
    readonly type = 'format-updated'

    constructor(readonly version: number) {
    }
}