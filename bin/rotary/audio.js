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
export class RotaryAutomationNode extends AudioWorkletNode {
    static build(context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield context.audioWorklet.addModule("bin/worklets/rotary-automation.js");
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
    }
    updateLoopDuration(seconds) {
        this.port.postMessage({
            action: "loopInSeconds",
            value: seconds
        });
    }
    updateFormat(model) {
        this.port.postMessage({
            action: "format",
            value: model.serialize()
        });
    }
}
export class RotarySineNode extends AudioWorkletNode {
    static build(context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield context.audioWorklet.addModule("bin/worklets/rotary-sine.js");
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
    }
}
export class RotarySampleNode extends AudioWorkletNode {
    static build(context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield context.audioWorklet.addModule("bin/worklets/rotary-sample.js");
            return new RotarySampleNode(context);
        });
    }
    constructor(context) {
        super(context, "rotary-sample", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            channelCount: RotaryModel.MAX_TRACKS,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        });
    }
    updateNumberOfTracks(numTracks) {
        this.port.postMessage({ action: "numTracks", value: numTracks });
    }
    updateSample(buffer) {
        this.port.postMessage({
            action: "sample", sample: [
                buffer.getChannelData(0),
                buffer.getChannelData(1)
            ], numFrames: buffer.length
        });
    }
}
export class MappingNode extends AudioWorkletNode {
    static load(context) {
        return __awaiter(this, void 0, void 0, function* () {
            return context.audioWorklet.addModule("bin/worklets/mapping.js");
        });
    }
    constructor(context) {
        super(context, "mapping", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [RotaryModel.MAX_TRACKS],
            channelCount: RotaryModel.MAX_TRACKS,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        });
    }
}
//# sourceMappingURL=audio.js.map