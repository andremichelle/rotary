import { RotaryModel } from "../model.js";
import { UpdateFormatMessage, UploadSampleMessage } from "./messages-to-processor.js";
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
        this.terminator = new Terminator();
        this.version = 0;
        this.updatingFormat = false;
        this.$phase = 0.0;
        const sendFormat = () => this.port.postMessage(new UpdateFormatMessage(model.serialize(), this.version));
        this.port.onmessage = event => {
            const msg = event.data;
            if (msg.type === "phase") {
                this.$phase = msg.phase;
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
    phase() {
        return this.$phase;
    }
    uploadSample(key, sample, loop = false) {
        if (sample instanceof AudioBuffer) {
            this.port.postMessage(UploadSampleMessage.from(key, sample, loop));
        }
        else if (sample instanceof Promise) {
            sample.then(buffer => this.port.postMessage(UploadSampleMessage.from(key, buffer, loop)));
        }
        else if (sample instanceof Float32Array) {
            this.port.postMessage(new UploadSampleMessage(key, [sample, sample], loop));
        }
        else if (Array.isArray(sample) && sample[0] instanceof Float32Array) {
            this.port.postMessage(new UploadSampleMessage(key, sample, loop));
        }
    }
    listenToTransport(transport) {
        return transport.addObserver(message => this.port.postMessage(message), false);
    }
}
//# sourceMappingURL=worklet.js.map