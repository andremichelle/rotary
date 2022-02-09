import {RotaryModel} from "../model.js"
import {UpdateFormatMessage, UploadSampleMessage} from "./messages-to-processor.js"
import {MessageToWorklet} from "./messages-to-worklet.js"
import {Terminable, Terminator} from "../../lib/common.js"
import {Transport, TransportListener} from "../../audio/sequencing.js"

export class RotaryWorkletNode extends AudioWorkletNode implements TransportListener {
    private readonly terminator: Terminator = new Terminator()

    private version: number = 0
    private updatingFormat: boolean = false

    private $position: number = 0.0

    constructor(context: BaseAudioContext, private readonly model: RotaryModel) {
        super(context, "rotary", {
            numberOfInputs: 0,
            numberOfOutputs: RotaryModel.MAX_TRACKS,
            outputChannelCount: new Array(RotaryModel.MAX_TRACKS).fill(2),
            channelCount: 2,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        })

        const sendFormat = () => this.port.postMessage(this.createUpdateFormatMessage())
        this.port.onmessage = event => {
            const msg = event.data as MessageToWorklet
            if (msg.type === "update-cursor") {
                this.$position = msg.position
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

    position() {
        return this.$position
    }

    uploadSample(key: number, sample: Promise<AudioBuffer> | AudioBuffer | Float32Array | Float32Array[], loop: boolean = false): void {
        if (sample instanceof AudioBuffer) {
            const frames = []
            for (let channelIndex = 0; channelIndex < 2; channelIndex++) {
                sample.copyFromChannel(frames[channelIndex] =
                    new Float32Array(sample.length), Math.min(channelIndex, sample.numberOfChannels - 1))
            }
            this.port.postMessage(RotaryWorkletNode.createUploadSampleMessage(key, frames, sample.length, loop))
        } else if (sample instanceof Promise) {
            sample.then(buffer => this.uploadSample(key, buffer, loop))
        } else if (sample instanceof Float32Array) {
            this.port.postMessage(RotaryWorkletNode.createUploadSampleMessage(key, [sample, sample], sample.length, loop))
        } else if (Array.isArray(sample) && sample[0] instanceof Float32Array) {
            this.port.postMessage(RotaryWorkletNode.createUploadSampleMessage(key, sample, sample[0].length, loop))
        }
    }

    listenToTransport(transport: Transport): Terminable {
        return transport.addObserver(message => this.port.postMessage(message), false)
    }

    private createUpdateFormatMessage(): UpdateFormatMessage {
        return {
            type: "update-format",
            format: this.model.serialize(),
            version: this.version
        }
    }

    private static createUploadSampleMessage(key: number, frames: Float32Array[], numFrames: number, loop: boolean): UploadSampleMessage {
        return {type: "upload-sample", key: key, frames: frames, numFrames: numFrames, loop: loop}
    }
}