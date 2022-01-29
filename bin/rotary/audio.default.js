var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { readAudio, Terminator } from "../lib/common.js";
import { pulsarDelay } from "../lib/dsp.js";
import { RotaryModel } from "./model.js";
import { LimiterWorklet } from "../dsp/limiter/worklet.js";
import { RotaryWorkletNode } from "./audio/worklet.js";
export const initAudioScene = () => {
    return {
        build(context, output, model, onProgressInfo) {
            return __awaiter(this, void 0, void 0, function* () {
                const terminator = new Terminator();
                const loadSample = (url) => __awaiter(this, void 0, void 0, function* () {
                    onProgressInfo(`loading ${url}`);
                    return yield readAudio(context, url);
                });
                const limiterWorklet = yield LimiterWorklet.build(context);
                const rotaryNode = yield RotaryWorkletNode.build(context);
                const masterGain = context.createGain();
                const updateFormat = () => rotaryNode.updateFormat(model);
                terminator.with(model.addObserver(updateFormat));
                updateFormat();
                let index = 0;
                for (let i = 0; i <= 19; i++) {
                    rotaryNode.uploadSample(index++, yield loadSample(`samples/kicks/${i}.wav`));
                }
                for (let i = 0; i <= 74; i++) {
                    rotaryNode.uploadSample(index++, yield loadSample(`samples/glitch/${i}.wav`));
                }
                for (let i = 0; i <= 19; i++) {
                    rotaryNode.uploadSample(index++, yield loadSample(`samples/clicks/${i}.wav`));
                }
                for (let i = 0; i <= 12; i++) {
                    rotaryNode.uploadSample(index++, yield loadSample(`samples/vinyl/${i}.wav`));
                }
                for (let i = 0; i <= 9; i++) {
                    rotaryNode.uploadSample(index++, yield loadSample(`samples/snares/${i}.wav`));
                }
                for (let i = 0; i <= 21; i++) {
                    rotaryNode.uploadSample(index++, yield loadSample(`samples/foley/${i}.wav`));
                }
                masterGain.gain.value = 1.0;
                const rotaryMuxer = context.createGain();
                for (let outIndex = 0; outIndex < RotaryModel.MAX_TRACKS; outIndex++) {
                    const outputGain = context.createGain();
                    outputGain.gain.value = 1.0;
                    rotaryNode.connect(outputGain, outIndex, 0).connect(rotaryMuxer);
                }
                const wetNode = context.createGain();
                wetNode.gain.value = 0.2;
                pulsarDelay(context, rotaryMuxer, wetNode, 0.125, 0.250, .250, 0.9, 2000, 200);
                const convolverNode = context.createConvolver();
                convolverNode.buffer = yield loadSample("impulse/DeepSpace.ogg");
                wetNode.connect(convolverNode).connect(masterGain);
                rotaryMuxer.connect(masterGain).connect(limiterWorklet);
                limiterWorklet.connect(output);
                return Promise.resolve({
                    transport: rotaryNode.transport,
                    rewind: () => __awaiter(this, void 0, void 0, function* () {
                        rotaryNode.rewind();
                    }),
                    phase: () => rotaryNode.phase(),
                    latency: () => limiterWorklet.lookahead,
                    terminate: () => terminator.terminate()
                });
            });
        }
    };
};
//# sourceMappingURL=audio.default.js.map