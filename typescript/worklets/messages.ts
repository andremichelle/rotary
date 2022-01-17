import {RotaryFormat} from "../rotary/model.js"

export type Message = UpdateFormatMessage | UpdateLoopDurationMessage | UpdateSampleMessage

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

export class UpdateSampleMessage {
    static from(buffer: AudioBuffer): UpdateSampleMessage {
        const raw = []
        for (let channelIndex = 0; channelIndex < buffer.numberOfChannels; channelIndex++) {
            buffer.copyFromChannel(raw[channelIndex] = new Float32Array(buffer.length), channelIndex)
        }
        return new UpdateSampleMessage(raw)
    }

    readonly type = 'sample'

    constructor(readonly sample: Float32Array[]) {
    }
}