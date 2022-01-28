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
import { initAudioScene } from "./rotary/audio.default.js";
import { Audio } from "./rotary/audio.js";
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
    const model = new RotaryModel().randomize(random);
    const audio = yield Audio.config(initAudioScene(), model);
    const app = RotaryApp.create(model);
    installApplicationMenu(document.querySelector("nav#app-menu"), model, audio[0], app);
    const exec = () => {
        const progress = audio[1].phase();
        app.render(progress);
        requestAnimationFrame(exec);
    };
    requestAnimationFrame(exec);
    document.getElementById("preloader").remove();
    console.log("ready...");
}))();
//# sourceMappingURL=main.js.map