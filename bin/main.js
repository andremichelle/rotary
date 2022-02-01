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
import { Audio } from "./rotary/audio.js";
import { initAudioScene } from "./rotary/audio.default.js";
import { WorkletModules } from "./dsp/waa.js";
import { MeterWorklet } from "./dsp/meter/worklet.js";
import { LimiterWorklet } from "./dsp/limiter/worklet.js";
import { RotaryWorkletNode } from "./rotary/audio/worklet.js";
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
    WorkletModules.register(MeterWorklet, "bin/dsp/meter/processor.js");
    WorkletModules.register(LimiterWorklet, "bin/dsp/limiter/processor.js");
    WorkletModules.register(RotaryWorkletNode, "bin/rotary/audio/processor.js");
    const random = new Mulberry32(0xFFFFFFFF * Math.random());
    const model = new RotaryModel().randomize(random);
    const audio = yield Audio.config(initAudioScene(), model);
    const preview = yield audio.initPreview();
    const app = RotaryApp.create(model).installApplicationMenu(audio);
    const exec = () => {
        const progress = preview.phase();
        app.render(progress);
        requestAnimationFrame(exec);
    };
    requestAnimationFrame(exec);
    document.getElementById("preloader").remove();
    console.log("ready...");
}))();
//# sourceMappingURL=main.js.map