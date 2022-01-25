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
import { midiToHz } from "../dsp/common.js";
import { Chords } from "../lib/chords.js";
import { Generator } from "../dsp/padsynth/generator.js";
import { Harmonic } from "../dsp/padsynth/data.js";
export const buildAudio = (setup) => __awaiter(void 0, void 0, void 0, function* () {
    const context = setup.context;
    const rotaryNode = yield RotaryPlaybackNode.build(context);
    const updateFormat = () => rotaryNode.updateFormat(setup.model);
    setup.model.addObserver(updateFormat);
    updateFormat();
    const loadSample = (url) => __awaiter(void 0, void 0, void 0, function* () {
        setup.loadInfo(`loading ${url}`);
        return yield readAudio(context, url);
    });
    const phaseShift = (source, offset) => {
        const length = source.length;
        const target = new Float32Array(length);
        for (let i = 0; i < length; i++) {
            target[i] = source[(i + offset) % length];
        }
        return [source, target];
    };
    {
        const gen = new Generator(1 << 16, context.sampleRate);
        const offset = Math.floor(context.sampleRate * 0.010);
        const compose = Chords.compose(Chords.Minor, 48, 0, 5);
        for (let i = 0; i < 24; i++) {
            const n = i % 5;
            const o = Math.floor(i / 5) * 12;
            const hz = midiToHz(compose[n] + o, 440.0);
            rotaryNode.updateSample(i, phaseShift(yield gen.render(Harmonic.make(hz / context.sampleRate, 0.1, 2.2)), offset), true);
        }
    }
    const wetNode = context.createGain();
    wetNode.gain.value = 0.4;
    pulsarDelay(context, rotaryNode, wetNode, 0.125, 0.250, .250, 0.9, 12000, 200);
    const convolverNode = context.createConvolver();
    convolverNode.buffer = yield loadSample("impulse/PlateLarge.ogg");
    const masterGain = context.createGain();
    masterGain.gain.value = 0.1;
    wetNode.connect(convolverNode).connect(masterGain);
    rotaryNode.connect(masterGain);
    masterGain.connect(setup.output);
});
//# sourceMappingURL=audio.02.js.map