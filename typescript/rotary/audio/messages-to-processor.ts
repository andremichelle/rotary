import {RotaryFormat} from "../model.js"
import {RewindMessage, TransportMessage} from "../../audio/messages.js"

export type MessageToProcessor = TransportMessage | RewindMessage | UpdateFormatMessage | UploadSampleMessage

export class UpdateFormatMessage {
    readonly type = 'format'

    constructor(readonly format: RotaryFormat, readonly version: number) {
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