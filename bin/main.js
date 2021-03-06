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
import { RotaryModel } from "./rotary/model/rotary.js";
import { RotaryApp } from "./rotary/app.js";
import { Audio } from "./rotary/audio.js";
import { initAudioScene } from "./rotary/audio.default.js";
import { install } from "./common.js";
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield install();
    const random = new Mulberry32(0xFFFFFFFF * Math.random());
    const model = new RotaryModel().randomize(random);
    const audio = yield Audio.config(initAudioScene(), model);
    const preview = yield audio.initPreview();
    const app = RotaryApp.create(model, preview)
        .installShortcuts(audio, preview)
        .installApplicationMenu(audio);
    const exec = () => {
        const progress = preview.position();
        app.render(progress);
        requestAnimationFrame(exec);
    };
    requestAnimationFrame(exec);
    document.getElementById("preloader").remove();
    console.log("ready...");
}))();
//# sourceMappingURL=main.js.map