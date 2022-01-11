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
import { pulsarDelay } from "./lib/dsp.js";
import { RotaryModel } from "./rotary/model.js";
import { RotaryApp } from "./rotary/app.js";
import { installApplicationMenu } from "./rotary/env.js";
import { RotaryWorkletNode } from "./rotary/audio.js";
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
    const model = new RotaryModel().test();
    const app = RotaryApp.create(model);
    installApplicationMenu(document.querySelector("nav#app-menu"), model, app);
    const loopInSeconds = 8.0;
    const context = new AudioContext();
    yield context.suspend();
    const rotaryNode = yield RotaryWorkletNode.build(context);
    rotaryNode.updateLoopDuration(loopInSeconds);
    const updateFormat = () => rotaryNode.updateFormat(model);
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
    pulsarDelay(context, rotaryNode, convolverNode, 0.500, 0.250, 0.750, 0.2, 20000.0, 20.0);
    const wetGain = context.createGain();
    wetGain.gain.value = 0.1;
    convolverNode.connect(wetGain).connect(context.destination);
    rotaryNode.connect(context.destination);
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