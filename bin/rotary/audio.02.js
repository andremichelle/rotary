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
import { cycle, pulsarDelay } from "../lib/dsp.js";
import { midiToHz } from "../dsp/common.js";
import { Chords } from "../lib/chords.js";
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
                const updateFormat = () => rotaryNode.updateFormat(model);
                terminator.with(model.addObserver(updateFormat));
                updateFormat();
                let index = 0;
                {
                    const compose = Chords.compose(Chords.Minor, 60, 0, 5);
                    for (let i = 0; i < compose.length; i++) {
                        onProgressInfo(`creating sound ${index + 1}`);
                        rotaryNode.updateSample(index++, yield cycle(context.sampleRate, midiToHz(compose[i], 440.0)), true);
                    }
                }
                {
                    const compose = Chords.compose(Chords.Minor, 60, 3, 5);
                    for (let i = 0; i < compose.length; i++) {
                        onProgressInfo(`creating sound ${index + 1}`);
                        rotaryNode.updateSample(index++, yield cycle(context.sampleRate, midiToHz(compose[i], 440.0)), true);
                    }
                }
                const wetNode = context.createGain();
                wetNode.gain.value = 0.4;
                pulsarDelay(context, rotaryNode, wetNode, 0.125, 0.250, .250, 0.9, 12000, 200);
                const convolverNode = context.createConvolver();
                convolverNode.buffer = yield loadSample("impulse/PlateLarge.ogg");
                const masterGain = context.createGain();
                masterGain.gain.value = 0.08;
                wetNode.connect(convolverNode).connect(masterGain);
                rotaryNode.connect(masterGain).connect(output);
                return Promise.resolve(terminator);
            });
        }
    };
};
//# sourceMappingURL=audio.02.js.map