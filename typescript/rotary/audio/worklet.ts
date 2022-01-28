import {RotaryModel} from "../model.js"
import {RewindMessage, TransportMessage, UpdateFormatMessage, UploadSampleMessage} from "./messages-to-processor.js"
import {MessageToWorklet} from "./messages-to-worklet.js"
import {ObservableValueImpl} from "../../lib/common.js"

export class RotaryWorkletNode extends AudioWorkletNode {
    static async build(context: BaseAudioContext): Promise<RotaryWorkletNode> {
        await context.audioWorklet.addModule("bin/rotary/audio/processor.js")
        return new RotaryWorkletNode(context)
    }

    readonly transport: ObservableValueImpl<boolean> = new ObservableValueImpl<boolean>(false)

    private $phase: number = 0.0

    constructor(context: BaseAudioContext) {
        super(context, "rotary", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        })

        this.transport.addObserver(moving => this.port.postMessage(new TransportMessage(moving)))

        this.port.onmessage = event => {
            const msg = event.data as MessageToWorklet
            if (msg.type === "phase") {
                this.$phase = msg.phase
            } else if (msg.type === "transport") {
                this.transport.set(msg.moving)
            }
        }

        this.onprocessorerror = (event: ErrorEvent) => {
            throw new Error(event.message)
        }
    }

    phase() {
        return this.$phase
    }

    rewind() {
        this.port.postMessage(new RewindMessage())
    }

    updateFormat(model: RotaryModel): void {
        this.port.postMessage(new UpdateFormatMessage(model.serialize()))
    }

    uploadSample(key: number, sample: AudioBuffer | Float32Array | Float32Array[], loop: boolean = false) {
        this.port.postMessage(
            sample instanceof AudioBuffer
                ? UploadSampleMessage.from(key, sample, loop)
                : new UploadSampleMessage(key, sample instanceof Float32Array ? [sample, sample] : sample, loop))
    }
}