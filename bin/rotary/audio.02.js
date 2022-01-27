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
import { readAudio, Terminator } from "../lib/common.js";
import { pulsarDelay } from "../lib/dsp.js";
const phaseShift = (source, offset) => {
    const length = source.length;
    const target = new Float32Array(length);
    for (let i = 0; i < length; i++) {
        target[i] = source[(i + offset) % length];
    }
    return [source, target];
};
export const initAudio = () => {
    return {
        build(context, output, model, onProgressInfo) {
            return __awaiter(this, void 0, void 0, function* () {
                const terminator = new Terminator();
                const loadSample = (url) => __awaiter(this, void 0, void 0, function* () {
                    onProgressInfo(`loading ${url}`);
                    return yield readAudio(context, url);
                });
                const rotaryNode = yield RotaryPlaybackNode.build(context);
                const masterGain = context.createGain();
                const updateFormat = () => rotaryNode.updateFormat(model);
                terminator.with(model.addObserver(updateFormat));
                updateFormat();
                let index = 0;
                for (let i = 0; i <= 50; i++) {
                    rotaryNode.updateSample(index++, yield loadSample(`samples/glitch/${i}.wav`));
                }
                for (let i = 0; i <= 19; i++) {
                    rotaryNode.updateSample(index++, yield loadSample(`samples/clicks/${i}.wav`));
                }
                for (let i = 0; i <= 12; i++) {
                    rotaryNode.updateSample(index++, yield loadSample(`samples/vinyl/${i}.wav`));
                }
                for (let i = 0; i <= 9; i++) {
                    rotaryNode.updateSample(index++, yield loadSample(`samples/snares/${i}.wav`));
                }
                for (let i = 0; i <= 8; i++) {
                    rotaryNode.updateSample(index++, yield loadSample(`samples/hang/${i}.wav`));
                }
                masterGain.gain.value = 0.5;
                const wetNode = context.createGain();
                wetNode.gain.value = 0.5;
                pulsarDelay(context, rotaryNode, wetNode, 0.125, 0.250, .250, 0.9, 2000, 200);
                const convolverNode = context.createConvolver();
                convolverNode.buffer = yield loadSample("impulse/DeepSpace.ogg");
                wetNode.connect(convolverNode).connect(masterGain);
                rotaryNode.connect(masterGain).connect(output);
                return Promise.resolve(terminator);
            });
        }
    };
};
//# sourceMappingURL=audio.02.js.map