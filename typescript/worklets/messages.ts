import {RotaryFormat} from "../rotary/model.js"

export type Message = UpdateFormatMessage | UpdateLoopDurationMessage

export class UpdateFormatMessage {
    readonly type = 'format'

    constructor(readonly format: RotaryFormat) {
    }
}

export class UpdateLoopDurationMessage {
    readonly type = 'loop-duration'

    constructor(readonly seconds: number) {
    }
}