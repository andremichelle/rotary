var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ArrayUtils, CollectionEventType, readAudio, Terminator } from "../lib/common.js";
import { LimiterWorklet } from "../audio/limiter/worklet.js";
import { RotaryWorkletNode } from "./audio/worklet.js";
import { Convolver, ConvolverSettings, Flanger, FlangerSettings, PulsarDelay, PulsarDelaySettings } from "../audio/composite.js";
import { NoUIMeterWorklet } from "../audio/meter/worklet.js";
import { Updater } from "../dom/common.js";
import { Transport } from "../audio/sequencing.js";
import { Metronome } from "../audio/metronome/worklet.js";
import { Mixer } from "../audio/mixer.js";
import { RotaryModel } from "./model/rotary.js";
import { dbToGain, interpolateParameterValueIfRunning } from "../audio/common.js";
export const initAudioScene = () => {
    return {
        loadModules(context) {
            return Promise.all([
                context.audioWorklet.addModule("bin/audio/lfo/processor.js"),
                context.audioWorklet.addModule("bin/audio/meter/processor.js"),
                context.audioWorklet.addModule("bin/audio/limiter/processor.js"),
                context.audioWorklet.addModule("bin/audio/metronome/processor.js"),
                context.audioWorklet.addModule("bin/rotary/audio/processor.js"),
            ]);
        },
        build(context, output, model, boot) {
            return __awaiter(this, void 0, void 0, function* () {
                const terminator = new Terminator();
                const transport = new Transport();
                const metronome = new Metronome(context);
                model.bpm.addObserver(value => metronome.setBpm(value), true);
                metronome.listenToTransport(transport);
                const rotaryNode = new RotaryWorkletNode(context, model);
                terminator.with(rotaryNode.listenToTransport(transport));
                const meter = new NoUIMeterWorklet(context, RotaryModel.MAX_TRACKS, 2);
                const limiterWorklet = new LimiterWorklet(context);
                const loadSample = (url) => boot.registerProcess(readAudio(context, url));
                const mute = !false;
                let index = 0;
                for (let i = 0; i <= 19 && mute; i++) {
                    rotaryNode.uploadSample(index++, loadSample(`samples/kicks/${i}.ogg`));
                }
                for (let i = 0; i <= 19 && mute; i++) {
                    rotaryNode.uploadSample(index++, loadSample(`samples/clicks/${i}.ogg`));
                }
                for (let i = 0; i <= 59 && mute; i++) {
                    rotaryNode.uploadSample(index++, loadSample(`samples/cracks/${i}.ogg`), true);
                }
                for (let i = 0; i <= 74 && mute; i++) {
                    rotaryNode.uploadSample(index++, loadSample(`samples/glitch/${i}.ogg`));
                }
                for (let i = 0; i <= 9 && mute; i++) {
                    rotaryNode.uploadSample(index++, loadSample(`samples/snares/${i}.ogg`));
                }
                for (let i = 0; i <= 23 && mute; i++) {
                    rotaryNode.uploadSample(index++, loadSample(`samples/neuro/${i}.ogg`));
                }
                for (let lineIndex = 0; lineIndex < RotaryModel.MAX_TRACKS; lineIndex++) {
                    rotaryNode.connect(meter, lineIndex, lineIndex);
                }
                const mixer = new Mixer(context, RotaryModel.NUM_AUX);
                const map = new Map();
                const channelstrips = new Map();
                const addTrack = (track) => {
                    const terminator = new Terminator();
                    const channelstrip = mixer.createChannelstrip();
                    channelstrips.set(track, channelstrip);
                    terminator.with(track.mute.addObserver(mute => channelstrip.setMute(mute), true));
                    terminator.with(track.solo.addObserver(solo => channelstrip.setSolo(solo), true));
                    terminator.with(track.volume.addObserver(volume => channelstrip.setVolume(volume), true));
                    terminator.with(track.panning.addObserver(panning => channelstrip.setPanning(panning), true));
                    for (let auxIndex = 0; auxIndex < RotaryModel.NUM_AUX; auxIndex++) {
                        terminator.with(track.aux[auxIndex]
                            .addObserver(volume => channelstrip.setAuxSend(auxIndex, volume), true));
                    }
                    terminator.with({ terminate: () => mixer.removeChannelstrip(channelstrip) });
                    return terminator;
                };
                const connectionUpdater = new Updater(() => {
                    for (const channelstrip of channelstrips.values()) {
                        channelstrip.disconnect();
                    }
                    model.tracks.forEach((item, index) => channelstrips.get(item).connectToInput(rotaryNode, index));
                });
                terminator.with(model.tracks.addObserver((event) => {
                    const track = event.item;
                    if (event.type === CollectionEventType.Add) {
                        map.set(track, addTrack(track));
                    }
                    else if (event.type === CollectionEventType.Remove) {
                        channelstrips.delete(track);
                        map.get(track).terminate();
                        map.delete(track);
                    }
                    connectionUpdater.requestUpdate();
                }, true));
                const auxTerminators = ArrayUtils.fill(model.aux.length, () => terminator.with(new Terminator()));
                model.aux.forEach((value, index) => {
                    terminator.with(value.addObserver(settings => {
                        const auxTerminator = auxTerminators[index];
                        auxTerminator.terminate();
                        let composite = null;
                        if (settings instanceof PulsarDelaySettings) {
                            composite = new PulsarDelay(context);
                        }
                        else if (settings instanceof ConvolverSettings) {
                            composite = new Convolver(context);
                        }
                        else if (settings instanceof FlangerSettings) {
                            composite = new Flanger(context);
                        }
                        if (null === composite) {
                            throw new Error(`Unknown composite for ${settings}`);
                        }
                        composite.connectToInput(mixer.auxSend(index));
                        composite.connectToOutput(mixer.auxReturn(index));
                        auxTerminator.with(composite.watchSettings(settings));
                        auxTerminator.with(composite);
                    }, true));
                });
                const masterGain = context.createGain();
                terminator.with(model.master_gain.addObserver(db => interpolateParameterValueIfRunning(context, masterGain.gain, dbToGain(db)), true));
                terminator.with(model.limiter_threshold.addObserver(db => limiterWorklet.threshold = db, true));
                mixer.masterOutput().connect(masterGain);
                masterGain.connect(limiterWorklet);
                metronome.connect(output);
                limiterWorklet.connect(output);
                yield boot.waitForCompletion();
                return Promise.resolve({
                    position: () => rotaryNode.position(),
                    latency: () => limiterWorklet.lookahead,
                    meter: meter,
                    metronome: metronome,
                    transport: transport,
                    terminate: () => terminator.terminate()
                });
            });
        }
    };
};
//# sourceMappingURL=audio.default.js.map