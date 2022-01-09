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
import { pulsarDelay } from "./lib/dsp.js";
import { RotaryModel } from "./rotary/model.js";
import { RotaryUI } from "./rotary/ui.js";
import { installApplicationMenu } from "./rotary/env.js";
(() => __awaiter(void 0, void 0, void 0, function* () {
    const model = new RotaryModel().randomize(new Mulberry32(Math.floor(0x987123F * Math.random())));
    const ui = RotaryUI.create(model);
    const nav = document.querySelector("nav#app-menu");
    installApplicationMenu(nav, model, ui);
    const loopInSeconds = 8.0;
    const context = new AudioContext();
    yield context.suspend();
    yield context.audioWorklet.addModule("bin/worklets/rotary.js");
    const rotaryNode = new AudioWorkletNode(context, "rotary", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
        channelCount: 1,
        channelCountMode: "explicit",
        channelInterpretation: "speakers"
    });
    const updateAll = () => {
        rotaryNode.port.postMessage({
            action: "format",
            value: model.serialize()
        });
    };
    rotaryNode.port.postMessage({
        action: "loopInSeconds",
        value: loopInSeconds
    });
    const observer = () => updateAll();
    const observers = new Map();
    model.tracks.forEach((track) => observers.set(track, track.addObserver(observer)));
    model.tracks.addObserver((event) => {
        if (event.type === CollectionEventType.Add) {
            observers.set(event.item, event.item.addObserver(observer));
        }
        else if (event.type === CollectionEventType.Remove) {
            const observer = observers.get(event.item);
            console.assert(observer !== undefined);
            observers.delete(event.item);
            observer.terminate();
        }
        else if (event.type === CollectionEventType.Order) {
        }
        updateAll();
    });
    updateAll();
    const convolverNode = context.createConvolver();
    convolverNode.normalize = false;
    readAudio(context, "./impulse/LargeWideEchoHall.ogg").then(buffer => convolverNode.buffer = buffer);
    pulsarDelay(context, rotaryNode, convolverNode, 0.500, 0.750, 0.250, 0.2, 20000.0, 20.0);
    const wetGain = context.createGain();
    wetGain.gain.value = 0.5;
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
        ui.render(progress - Math.floor(progress));
        requestAnimationFrame(enterFrame);
    };
    requestAnimationFrame(enterFrame);
}))();
//# sourceMappingURL=main.js.map