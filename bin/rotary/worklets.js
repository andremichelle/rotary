var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { RotaryModel } from "./model.js";
import { UpdateFormatMessage, UpdateSampleMessage } from "../worklets/worklet.js";
export const handleErrors = (worklet) => {
    worklet.onprocessorerror = (event) => {
        console.log(`error occurred. message: ${event.message}`);
        throw new Error(event.message);
    };
};
export class RotaryAutomationNode extends AudioWorkletNode {
    static build(context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield context.audioWorklet.addModule("bin/worklets/automation.js");
            return new RotaryAutomationNode(context);
        });
    }
    constructor(context) {
        super(context, "rotary-automation", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [RotaryModel.MAX_TRACKS],
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        });
        handleErrors(this);
    }
    updateFormat(model) {
        this.port.postMessage(new UpdateFormatMessage(model.serialize()));
    }
}
export class RotarySineNode extends AudioWorkletNode {
    static build(context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield context.audioWorklet.addModule("bin/worklets/sine.js");
            return new RotarySineNode(context);
        });
    }
    constructor(context) {
        super(context, "rotary-sine", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [1],
            channelCount: RotaryModel.MAX_TRACKS,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        });
        handleErrors(this);
    }
}
export class RotaryPlaybackNode extends AudioWorkletNode {
    static build(context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield context.audioWorklet.addModule("bin/worklets/playback.js");
            return new RotaryPlaybackNode(context);
        });
    }
    constructor(context) {
        super(context, "rotary-playback", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        });
        handleErrors(this);
    }
    updateFormat(model) {
        this.port.postMessage(new UpdateFormatMessage(model.serialize()));
    }
    updateSample(key, buffer) {
        this.port.postMessage(UpdateSampleMessage.from(key, buffer));
    }
}
//# sourceMappingURL=worklets.js.map