import { RotaryModel } from "../model/rotary.js";
import { Terminator } from "../../lib/common.js";
export class RotaryWorkletNode extends AudioWorkletNode {
    constructor(context, model) {
        super(context, "rotary", {
            numberOfInputs: 0,
            numberOfOutputs: RotaryModel.MAX_TRACKS,
            outputChannelCount: new Array(RotaryModel.MAX_TRACKS).fill(2),
            channelCount: 2,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        });
        this.model = model;
        this.terminator = new Terminator();
        this.version = 0;
        this.updatingFormat = false;
        this.$position = 0.0;
        const sendFormat = () => this.port.postMessage(this.createUpdateFormatMessage());
        this.port.onmessage = event => {
            const msg = event.data;
            if (msg.type === "update-cursor") {
                this.$position = msg.position;
            }
            else if (msg.type === "format-updated") {
                if (this.version === msg.version) {
                    this.updatingFormat = false;
                }
                else {
                    sendFormat();
                }
            }
        };
        this.onprocessorerror = (event) => {
            console.warn(event.message);
            document.querySelector("button.error").classList.remove("hidden");
        };
        this.terminator.with(model.addObserver(() => {
            this.version++;
            if (!this.updatingFormat) {
                this.updatingFormat = true;
                setTimeout(sendFormat, 1);
            }
        }, true));
    }
    position() {
        return this.$position;
    }
    uploadSample(key, sample, loop = false) {
        if (sample instanceof AudioBuffer) {
            const frames = [];
            for (let channelIndex = 0; channelIndex < 2; channelIndex++) {
                sample.copyFromChannel(frames[channelIndex] =
                    new Float32Array(sample.length), Math.min(channelIndex, sample.numberOfChannels - 1));
            }
            this.port.postMessage(RotaryWorkletNode.createUploadSampleMessage(key, frames, sample.length, loop));
        }
        else if (sample instanceof Promise) {
            sample.then(buffer => this.uploadSample(key, buffer, loop));
        }
        else if (sample instanceof Float32Array) {
            this.port.postMessage(RotaryWorkletNode.createUploadSampleMessage(key, [sample, sample], sample.length, loop));
        }
        else if (Array.isArray(sample) && sample[0] instanceof Float32Array) {
            this.port.postMessage(RotaryWorkletNode.createUploadSampleMessage(key, sample, sample[0].length, loop));
        }
    }
    listenToTransport(transport) {
        return transport.addObserver(message => this.port.postMessage(message), false);
    }
    createUpdateFormatMessage() {
        return {
            type: "update-format",
            format: this.model.serialize(),
            version: this.version
        };
    }
    static createUploadSampleMessage(key, frames, numFrames, loop) {
        return { type: "upload-sample", key: key, frames: frames, numFrames: numFrames, loop: loop };
    }
}
//# sourceMappingURL=worklet.js.map