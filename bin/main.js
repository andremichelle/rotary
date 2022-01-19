var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Mulberry32 } from "./lib/math.js";
import { RotaryModel } from "./rotary/model.js";
import { RotaryApp } from "./rotary/app.js";
import { installApplicationMenu } from "./rotary/env.js";
import { buildAudio } from "./rotary/audio.01.js";
import { MeterWorklet } from "./dsp/meter/worklet.js";
import { Dom } from "./dom/common.js";
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
    const random = new Mulberry32(0xFFFFFFFF * Math.random());
    const model = new RotaryModel().test();
    const app = RotaryApp.create(model);
    installApplicationMenu(document.querySelector("nav#app-menu"), model, app);
    const context = new AudioContext();
    yield context.suspend();
    yield MeterWorklet.load(context);
    const meter = new MeterWorklet(context);
    meter.connect(context.destination);
    yield buildAudio(context, meter, model, random);
    Dom.replaceElement(meter.domElement, document.getElementById("meter"));
    const playButton = document.querySelector("[data-parameter='transport']");
    context.onstatechange = () => playButton.checked = context.state === "running";
    playButton.onchange = () => __awaiter(void 0, void 0, void 0, function* () {
        if (playButton.checked)
            yield context.resume();
        else
            yield context.suspend();
    });
    const exec = () => {
        const progress = context.currentTime / model.loopDuration.get();
        app.render(progress - Math.floor(progress));
        requestAnimationFrame(exec);
    };
    requestAnimationFrame(exec);
    document.getElementById("preloader").remove();
    console.log("ready...");
}))();
//# sourceMappingURL=main.js.map