var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CollectionEventType, readAudio } from "./lib/common.js";
import { Mulberry32 } from "./lib/math.js";
import { RotaryModel } from "./rotary/model.js";
import { RotaryApp } from "./rotary/app.js";
import { installApplicationMenu } from "./rotary/env.js";
import { MappingNode, RotaryAutomationNode } from "./rotary/audio.js";
import { Generator } from "./padsynth/generator.js";
import { Harmonic } from "./padsynth/data.js";
import { DSP, pulsarDelay } from "./lib/dsp.js";
const showError = (message) => {
    const preloader = document.getElementById("preloader");
    if (null === preloader) {
        alert(message);
    }
    else {
        preloader.innerHTML = `<span style="color: #F33">${message}</span>`;
    }
};
window.onerror = (message) => {
    showError(message);
    return true;
};
window.onunhandledrejection = (event) => {
    if (event.reason instanceof Error) {
        showError(event.reason.message);
    }
    else {
        showError(event.reason);
    }
};
(() => __awaiter(void 0, void 0, void 0, function* () {
    const model = new RotaryModel().randomize(new Mulberry32(Math.floor(0x987123F * Math.random())));
    const app = RotaryApp.create(model);
    installApplicationMenu(document.querySelector("nav#app-menu"), model, app);
    const loopInSeconds = 8.0;
    const context = new AudioContext();
    yield context.suspend();
    const rotaryAutomationNode = yield RotaryAutomationNode.build(context);
    rotaryAutomationNode.updateLoopDuration(loopInSeconds);
    const updateFormat = () => {
        rotaryAutomationNode.updateFormat(model);
    };
    const observers = new Map();
    model.tracks.forEach((track) => observers.set(track, track.addObserver(updateFormat)));
    model.tracks.addObserver((event) => {
        if (event.type === CollectionEventType.Add) {
            observers.set(event.item, event.item.addObserver(updateFormat));
        }
        else if (event.type === CollectionEventType.Remove) {
            const observer = observers.get(event.item);
            console.assert(observer !== undefined);
            observers.delete(event.item);
            observer.terminate();
        }
        else if (event.type === CollectionEventType.Order) {
        }
        updateFormat();
    });
    updateFormat();
    const convolverNode = context.createConvolver();
    convolverNode.normalize = false;
    convolverNode.buffer = yield readAudio(context, "./impulse/LargeWideEchoHall.ogg");
    const tracksGain = context.createGain();
    tracksGain.gain.value = 0.2;
    yield MappingNode.load(context);
    const mappingNode = new MappingNode(context);
    rotaryAutomationNode.connect(mappingNode);
    const channelSplitter = context.createChannelSplitter(RotaryModel.MAX_TRACKS);
    mappingNode.connect(channelSplitter);
    const notes = new Uint8Array([60, 62, 65, 67, 69]);
    const random = new Mulberry32(0xF7DAAA);
    const generator = new Generator(1 << 16);
    for (let i = 0; i < RotaryModel.MAX_TRACKS; i++) {
        const filter = context.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 0.0;
        filter.Q.value = 4.1;
        channelSplitter.connect(filter.frequency, i);
        const pannerNode = context.createStereoPanner();
        pannerNode.pan.value = random.nextDouble(-1.0, 1.0);
        const o = Math.floor(i / notes.length) + 1;
        const n = i % notes.length;
        const hz = DSP.midiToHz(o * 12 + notes[n]);
        const harmonics = Harmonic.make(hz / context.sampleRate, random.nextDouble(0.1, 0.8), random.nextDouble(0.99, 1.2), random.nextDouble(-2.0, -0.5), Math.floor(random.nextDouble(1.0, 3.0)), Math.floor(random.nextDouble(4.0, 32.0)));
        const gain = random.nextDouble(0.25, 1.0);
        harmonics.forEach(harmonic => harmonic.level *= gain);
        const wavetable = yield generator.render(harmonics);
        const buffer = context.createBuffer(1, wavetable.length, context.sampleRate);
        buffer.copyToChannel(wavetable, 0);
        const bufferSource = context.createBufferSource();
        bufferSource.buffer = buffer;
        bufferSource.playbackRate.value = random.nextDouble(-0.999, 1.001);
        bufferSource.loop = true;
        bufferSource.start();
        bufferSource.connect(filter).connect(pannerNode).connect(tracksGain);
    }
    tracksGain.connect(context.destination);
    pulsarDelay(context, tracksGain, convolverNode, 0.500, 0.250, 0.750, 0.9, 12000.0, 20.0);
    const wetGain = context.createGain();
    wetGain.gain.value = 0.3;
    tracksGain.connect(convolverNode).connect(wetGain).connect(context.destination);
    const playButton = document.querySelector("[data-parameter='transport']");
    playButton.onchange = () => __awaiter(void 0, void 0, void 0, function* () {
        if (playButton.checked)
            yield context.resume();
        else
            yield context.suspend();
    });
    document.getElementById("preloader").remove();
    console.log("ready...");
    const enterFrame = () => {
        const progress = context.currentTime / loopInSeconds;
        app.render(progress - Math.floor(progress));
        requestAnimationFrame(enterFrame);
    };
    requestAnimationFrame(enterFrame);
}))();
//# sourceMappingURL=main.js.map