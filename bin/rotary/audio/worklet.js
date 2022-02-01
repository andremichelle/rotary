import { RotaryModel } from "../model.js";
import { RewindMessage, TransportMessage, UpdateFormatMessage, UploadSampleMessage } from "./messages-to-processor.js";
import { ObservableValueImpl } from "../../lib/common.js";
export class RotaryWorkletNode extends AudioWorkletNode {
    constructor(context) {
        super(context, "rotary", {
            numberOfInputs: 0,
            numberOfOutputs: RotaryModel.MAX_TRACKS,
            outputChannelCount: new Array(RotaryModel.MAX_TRACKS).fill(2),
            channelCount: 2,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        });
        this.transport = new ObservableValueImpl(false);
        this.$phase = 0.0;
        this.transport.addObserver(moving => this.port.postMessage(new TransportMessage(moving)));
        this.port.onmessage = event => {
            const msg = event.data;
            if (msg.type === "phase") {
                this.$phase = msg.phase;
            }
            else if (msg.type === "transport") {
                this.transport.set(msg.moving);
            }
        };
        this.onprocessorerror = (event) => {
            console.warn(event.message);
            document.querySelector("button.error").classList.remove("hidden");
        };
    }
    phase() {
        return this.$phase;
    }
    rewind() {
        this.port.postMessage(new RewindMessage());
    }
    updateFormat(model) {
        this.port.postMessage(new UpdateFormatMessage(model.serialize()));
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
}
//# sourceMappingURL=worklet.js.map