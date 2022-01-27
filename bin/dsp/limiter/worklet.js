var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { SetLookahead, SetThreshold } from "./message.js";
export class LimiterWorklet extends AudioWorkletNode {
    constructor(context) {
        super(context, "limiter", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            channelCount: 2,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        });
        this.$lookahead = NaN;
        this.$threshold = NaN;
        this.lookahead = 0.005;
        this.threshold = -6.0;
    }
    static build(context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield context.audioWorklet.addModule("bin/dsp/limiter/processor.js");
            return new LimiterWorklet(context);
        });
    }
    set lookahead(seconds) {
        if (this.$lookahead === seconds) {
            return;
        }
        this.port.postMessage(new SetLookahead(seconds));
        this.$lookahead = seconds;
    }
    get lookahead() {
        return this.$lookahead;
    }
    set threshold(db) {
        if (this.$threshold === db) {
            return;
        }
        this.port.postMessage(new SetThreshold(db));
        this.$threshold = db;
    }
    get threshold() {
        return this.$threshold;
    }
}
//# sourceMappingURL=worklet.js.map