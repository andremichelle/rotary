import {SetBpm, SetEnabled} from "./message.js"
import {Transport, TransportListener} from "../sequencing.js"
import {ObservableValueImpl, Terminable} from "../../lib/common.js"

export class Metronome extends AudioWorkletNode implements TransportListener {
    readonly enabled: ObservableValueImpl<boolean> = new ObservableValueImpl<boolean>(false)

    constructor(context: BaseAudioContext) {
        super(context, "metronome", {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [1],
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        })

        this.enabled.addObserver(value => this.port.postMessage(new SetEnabled(value)))
    }

    setBpm(value: number): void {
        this.port.postMessage(new SetBpm(value))
    }

    listenToTransport(transport: Transport): Terminable {
        return transport.addObserver(message => this.port.postMessage(message), false)
    }
}