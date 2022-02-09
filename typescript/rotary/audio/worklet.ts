import {RotaryModel} from "../model.js"
import {UpdateFormatMessage, UploadSampleMessage} from "./messages-to-processor.js"
import {MessageToWorklet} from "./messages-to-worklet.js"
import {Terminable, Terminator} from "../../lib/common.js"
import {Transport, TransportListener} from "../../audio/sequencing.js"

export class RotaryWorkletNode extends AudioWorkletNode implements TransportListener {
    private readonly terminator: Terminator = new Terminator()

    private version: number = 0
    private updatingFormat: boolean = false

    private $phase: number = 0.0

    constructor(context: BaseAudioContext, model: RotaryModel) {
        super(context, "rotary", {
            numberOfInputs: 0,
            numberOfOutputs: RotaryModel.MAX_TRACKS,
            outputChannelCount: new Array(RotaryModel.MAX_TRACKS).fill(2),
            channelCount: 2,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        })

        const sendFormat = () => this.port.postMessage(new UpdateFormatMessage(model.serialize(), this.version))
        this.port.onmessage = event => {
            const msg = event.data as MessageToWorklet
            if (msg.type === "phase") {
                this.$phase = msg.phase
            } else if (msg.type === "format-updated") {
                if (this.version === msg.version) {
                    this.updatingFormat = false
                } else {
                    sendFormat()
                }
            }
        }
        this.onprocessorerror = (event: ErrorEvent) => {
            console.warn(event.message)
            document.querySelector("button.error").classList.remove("hidden")
        }

        this.terminator.with(model.addObserver(() => {
            this.version++
            if (!this.updatingFormat) {
                this.updatingFormat = true
                setTimeout(sendFormat, 1)
            }
        }, true))
    }

    phase() {
        return this.$phase
    }

    uploadSample(key: number, sample: Promise<AudioBuffer> | AudioBuffer | Float32Array | Float32Array[], loop: boolean = false) {
        if (sample instanceof AudioBuffer) {
            this.port.postMessage(UploadSampleMessage.from(key, sample, loop))
        } else if (sample instanceof Promise) {
            sample.then(buffer => this.port.postMessage(UploadSampleMessage.from(key, buffer, loop)))
        } else if (sample instanceof Float32Array) {
            this.port.postMessage(new UploadSampleMessage(key, [sample, sample], loop))
        } else if (Array.isArray(sample) && sample[0] instanceof Float32Array) {
            this.port.postMessage(new UploadSampleMessage(key, sample, loop))
        }
    }

    listenToTransport(transport: Transport): Terminable {
        return transport.addObserver(message => this.port.postMessage(message), false)
    }
}