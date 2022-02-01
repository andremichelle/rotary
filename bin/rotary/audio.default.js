var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CollectionEventType, readAudio, Terminator } from "../lib/common.js";
import { RotaryModel } from "./model.js";
import { LimiterWorklet } from "../dsp/limiter/worklet.js";
import { RotaryWorkletNode } from "./audio/worklet.js";
import { Mixer, PulsarDelay } from "../dsp/composite.js";
import { WorkletModules } from "../dsp/waa.js";
export const initAudioScene = () => {
    return {
        build(context, output, model, boot) {
            return __awaiter(this, void 0, void 0, function* () {
                const terminator = new Terminator();
                const rotaryNode = yield WorkletModules.create(context, RotaryWorkletNode);
                const limiterWorklet = yield WorkletModules.create(context, LimiterWorklet);
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
                const mixer = new Mixer(context, RotaryModel.NUM_AUX);
                const map = new Map();
                const addTrack = (track, index) => {
                    const terminator = new Terminator();
                    const channelstrip = mixer.createChannelstrip();
                    channelstrip.connectToInput(rotaryNode, index);
                    terminator.with(track.mute.addObserver(mute => channelstrip.setMute(mute), true));
                    terminator.with(track.solo.addObserver(solo => channelstrip.setSolo(solo), true));
                    terminator.with(track.volume.addObserver(volume => channelstrip.setVolume(volume), true));
                    terminator.with(track.panning.addObserver(panning => channelstrip.setPanning(panning), true));
                    for (let index = 0; index < RotaryModel.NUM_AUX; index++) {
                        terminator.with(track.auxSends[index]
                            .addObserver(volume => channelstrip.setAuxSend(index, volume), true));
                    }
                    terminator.with({ terminate: () => mixer.removeChannelstrip(channelstrip) });
                    return terminator;
                };
                terminator.with(model.tracks.addObserver((event) => {
                    const track = event.item;
                    if (event.type === CollectionEventType.Add) {
                        map.set(track, addTrack(track, event.index));
                    }
                    else if (event.type === CollectionEventType.Remove) {
                        map.get(track).terminate();
                        map.delete(track);
                    }
                }, true));
                const pulsarDelay = new PulsarDelay(context);
                pulsarDelay.connectToInput(mixer.auxSend(0), 0);
                pulsarDelay.connectToOutput(mixer.auxReturn(0), 0);
                terminator.with(pulsarDelay.watchSettings(model.aux.sendPulsarDelay));
                const convolverNode = context.createConvolver();
                convolverNode.buffer = yield loadSample("impulse/LargeWideEchoHall.ogg");
                terminator.with(model.aux.sendConvolver.addObserver((path) => __awaiter(this, void 0, void 0, function* () { return convolverNode.buffer = yield readAudio(context, path); })));
                mixer.auxSend(1).connect(convolverNode).connect(mixer.auxReturn(1));
                mixer.masterOutput().connect(limiterWorklet);
                limiterWorklet.connect(output);
                yield boot.waitForCompletion();
                return Promise.resolve({
                    transport: rotaryNode.transport,
                    rewind: () => rotaryNode.rewind(),
                    phase: () => rotaryNode.phase(),
                    latency: () => limiterWorklet.lookahead,
                    terminate: () => terminator.terminate()
                });
            });
        }
    };
};
//# sourceMappingURL=audio.default.js.map