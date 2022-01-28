export type MessageToWorklet = UpdateCursorMessage | TransportMessage

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