export type Message = SetBpm

export class SetBpm {
    readonly type = 'bpm'

    constructor(readonly value: number) {
    }
}