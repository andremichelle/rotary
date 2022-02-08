export class RewindMessage {
    readonly type = 'rewind'

    constructor() {
    }
}

export class TransportMessage {
    readonly type = 'transport'

    constructor(readonly moving: boolean) {
    }
}