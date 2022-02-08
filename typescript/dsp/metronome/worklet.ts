import {SetBpm} from "./message.js"
import {RewindMessage, TransportMessage} from "../messages.js"

export class Metronome extends AudioWorkletNode {
    constructor(context: BaseAudioContext) {
        super(context, "metronome", {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [1],
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        })
    }

    rewind(): void {
        this.port.postMessage(new RewindMessage())
    }

    transport(moving: boolean): void {
        this.port.postMessage(new TransportMessage(moving))
    }

    setBpm(value: number): void {
        this.port.postMessage(new SetBpm(value))
    }
}