export type MessageToWorklet = UpdateCursorMessage | TransportMessage | FormatUpdatedMessage

export class UpdateCursorMessage {
    readonly type = 'phase'

    constructor(readonly phase: number) {
    }
}

export class TransportMessage {
    readonly type = 'transport'

    constructor(readonly moving: boolean) {
    }
}

export class FormatUpdatedMessage {
    readonly type = 'format-updated'

    constructor(readonly version: number) {
    }
}