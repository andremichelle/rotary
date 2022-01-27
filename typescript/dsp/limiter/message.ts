export type Message = SetLookahead | SetThreshold

export class SetLookahead {
    readonly type = 'lookahead'

    constructor(readonly seconds: number) {
    }
}

export class SetThreshold {
    readonly type = 'threshold'

    constructor(readonly db: number) {
    }
}