import {RotaryFormat} from "../rotary/model.js"

export type Message = UpdateFormatMessage | UpdateSampleMessage

export class UpdateFormatMessage {
    readonly type = 'format'

    constructor(readonly format: RotaryFormat) {
    }
}

export class UpdateSampleMessage {
    static from(key: number, buffer: AudioBuffer): UpdateSampleMessage {
        const raw = []
        for (let channelIndex = 0; channelIndex < 2; channelIndex++) {
            buffer.copyFromChannel(raw[channelIndex] =
                new Float32Array(buffer.length), Math.min(channelIndex, buffer.numberOfChannels - 1))
        }
        return new UpdateSampleMessage(key, raw)
    }

    readonly type = 'sample'

    constructor(readonly key: number, readonly sample: Float32Array[]) {
    }
}