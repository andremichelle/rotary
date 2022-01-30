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
import { RotaryModel } from "./model.js";
import { LimiterWorklet } from "../dsp/limiter/worklet.js";
import { RotaryWorkletNode } from "./audio/worklet.js";
import { Mixer, MixerModel } from "./mixer.js";
export const initAudioScene = () => {
    return {
        build(context, output, model, boot) {
            return __awaiter(this, void 0, void 0, function* () {
                const terminator = new Terminator();
                const limiterWorklet = yield LimiterWorklet.build(context);
                const rotaryNode = yield RotaryWorkletNode.build(context);
                const updateFormat = () => rotaryNode.updateFormat(model);
                terminator.with(model.addObserver(updateFormat));
                updateFormat();
                const loadSample = (url) => {
                    return boot.registerProcess(readAudio(context, url));
                };
                let index = 0;
                for (let i = 0; i <= 19; i++) {
                    rotaryNode.uploadSample(index++, loadSample(`samples/kicks/${i}.wav`));
                }
                for (let i = 0; i <= 74; i++) {
                    rotaryNode.uploadSample(index++, loadSample(`samples/glitch/${i}.wav`));
                }
                for (let i = 0; i <= 19; i++) {
                    rotaryNode.uploadSample(index++, loadSample(`samples/clicks/${i}.wav`));
                }
                for (let i = 0; i <= 12; i++) {
                    rotaryNode.uploadSample(index++, loadSample(`samples/vinyl/${i}.wav`));
                }
                for (let i = 0; i <= 9; i++) {
                    rotaryNode.uploadSample(index++, loadSample(`samples/snares/${i}.wav`));
                }
                for (let i = 0; i <= 21; i++) {
                    rotaryNode.uploadSample(index++, loadSample(`samples/foley/${i}.wav`));
                }
                const mixerModel = new MixerModel(RotaryModel.MAX_TRACKS, 4);
                for (let i = 0; i < RotaryModel.MAX_TRACKS; i++) {
                    mixerModel.channels[i].auxSends[0].set(i / RotaryModel.MAX_TRACKS);
                }
                const mixer = new Mixer(context, mixerModel);
                for (let outIndex = 0; outIndex < RotaryModel.MAX_TRACKS; outIndex++) {
                    rotaryNode.connect(mixer.channelstrips[outIndex].input(), outIndex, 0);
                }
                const convolverNode = context.createConvolver();
                convolverNode.buffer = yield loadSample("impulse/LargeWideEchoHall.ogg");
                mixer.auxSend(0).connect(convolverNode).connect(mixer.auxReturn(0));
                mixer.masterOutput().connect(limiterWorklet);
                limiterWorklet.connect(output);
                yield boot.waitForCompletion();
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