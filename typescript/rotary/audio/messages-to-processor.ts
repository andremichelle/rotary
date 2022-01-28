import {RotaryFormat} from "../model.js"

export type MessageToProcessor = TransportMessage | RewindMessage | UpdateFormatMessage | UploadSampleMessage

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

export class UpdateFormatMessage {
    readonly type = 'format'

    constructor(readonly format: RotaryFormat) {
    }
}

export class UploadSampleMessage {
    static from(key: number, buffer: AudioBuffer, loop: boolean): UploadSampleMessage {
        const raw = []
        for (let channelIndex = 0; channelIndex < 2; channelIndex++) {
            buffer.copyFromChannel(raw[channelIndex] =
                new Float32Array(buffer.length), Math.min(channelIndex, buffer.numberOfChannels - 1))
        }
        return new UploadSampleMessage(key, raw, loop)
    }

    readonly type = 'sample'

    constructor(readonly key: number, readonly sample: Float32Array[], readonly loop: boolean) {
    }
}