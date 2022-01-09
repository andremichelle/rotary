var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class RotaryWorkletNode extends AudioWorkletNode {
    static build(context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield context.audioWorklet.addModule("bin/worklets/rotary.js");
            return new RotaryWorkletNode(context);
        });
    }
    constructor(context) {
        super(context, "rotary", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [1],
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
//# sourceMappingURL=audio.js.map