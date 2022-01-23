var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { RotaryPlaybackNode } from "./worklets.js";
import { readAudio } from "../lib/common.js";
import { pulsarDelay } from "../lib/dsp.js";
export const buildAudio = (context, output, model, random) => __awaiter(void 0, void 0, void 0, function* () {
    const rotaryNode = yield RotaryPlaybackNode.build(context);
    const updateFormat = () => rotaryNode.updateFormat(model);
    model.addObserver(updateFormat);
    updateFormat();
    rotaryNode.updateSample(0, yield readAudio(context, "samples/hang/0.wav"));
    rotaryNode.updateSample(1, yield readAudio(context, "samples/hang/1.wav"));
    rotaryNode.updateSample(2, yield readAudio(context, "samples/hang/2.wav"));
    rotaryNode.updateSample(3, yield readAudio(context, "samples/hang/3.wav"));
    rotaryNode.updateSample(4, yield readAudio(context, "samples/hang/4.wav"));
    rotaryNode.updateSample(5, yield readAudio(context, "samples/hang/5.wav"));
    rotaryNode.updateSample(6, yield readAudio(context, "samples/hang/6.wav"));
    rotaryNode.updateSample(7, yield readAudio(context, "samples/hang/7.wav"));
    rotaryNode.updateSample(8, yield readAudio(context, "samples/hang/8.wav"));
    const wetNode = context.createGain();
    wetNode.gain.value = 0.4;
    pulsarDelay(context, rotaryNode, wetNode, 0.125, 0.250, .250, 0.9, 12000, 200);
    const convolverNode = context.createConvolver();
    convolverNode.buffer = yield readAudio(context, "impulse/PlateLarge.ogg");
    wetNode.connect(convolverNode).connect(output);
    rotaryNode.connect(output);
});
//# sourceMappingURL=audio.02.js.map