export type Message = SetBpm | SetEnabled

export class SetBpm {
    readonly type = 'bpm'

    constructor(readonly value: number) {
    }
}

export class SetEnabled {
    readonly type = 'enabled'

    constructor(readonly value: boolean) {
    }
}