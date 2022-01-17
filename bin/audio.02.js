var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { RotaryPlaybackNode } from "./rotary/audio.js";
import { ObservableCollection } from "./lib/common.js";
export const buildAudio = (context, model, random) => __awaiter(void 0, void 0, void 0, function* () {
    const rotaryNode = yield RotaryPlaybackNode.build(context);
    model.loopDuration.addObserver(seconds => rotaryNode.updateLoopDuration(seconds));
    rotaryNode.updateLoopDuration(model.loopDuration.get());
    const updateFormat = () => rotaryNode.updateFormat(model);
    ObservableCollection.observeNested(model.tracks, updateFormat);
    updateFormat();
    rotaryNode.connect(context.destination);
});
//# sourceMappingURL=audio.02.js.map