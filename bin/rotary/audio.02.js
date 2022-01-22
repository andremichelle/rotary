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
export const buildAudio = (context, output, model, random) => __awaiter(void 0, void 0, void 0, function* () {
    const rotaryNode = yield RotaryPlaybackNode.build(context);
    const updateFormat = () => rotaryNode.updateFormat(model);
    model.addObserver(updateFormat);
    updateFormat();
    const buffer = yield readAudio(context, "samples/tiny.wav");
    rotaryNode.updateSample(buffer);
    rotaryNode.connect(output);
});
//# sourceMappingURL=audio.02.js.map