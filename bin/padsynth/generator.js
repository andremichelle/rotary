var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CreateMessage, InitMessage } from "./data.js";
export class Generator {
    constructor(fftSize, sampleRate) {
        this.worker = new Worker("bin/padsynth/worker.js", { type: "module" });
        this.tasks = [];
        this.worker.onerror = ev => console.warn(ev);
        this.worker.onmessage = event => {
            const data = event.data;
            if (data.type === "created") {
                this.tasks.shift()(data.wavetable);
            }
        };
        this.worker.postMessage(new InitMessage(fftSize, sampleRate));
    }
    render(harmonics) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(((resolve) => {
                this.tasks.push(resolve);
                this.worker.postMessage(new CreateMessage(harmonics));
            }));
        });
    }
}
//# sourceMappingURL=generator.js.map