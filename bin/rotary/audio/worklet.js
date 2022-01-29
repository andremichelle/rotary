var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    static build(context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield context.audioWorklet.addModule("bin/rotary/audio/processor.js");
            return new RotaryWorkletNode(context);
        });
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
        this.port.postMessage(sample instanceof AudioBuffer
            ? UploadSampleMessage.from(key, sample, loop)
            : new UploadSampleMessage(key, sample instanceof Float32Array ? [sample, sample] : sample, loop));
    }
}
//# sourceMappingURL=worklet.js.map