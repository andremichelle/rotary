var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class Generator {
    constructor(fftSize, sampleRate) {
        this.worker = new Worker("bin/audio/padsynth/worker.js", { type: "module" });
        this.tasks = [];
        this.worker.onerror = ev => console.warn(ev);
        this.worker.onmessage = event => {
            const data = event.data;
            if (data.type === "created") {
                this.tasks.shift()(data.wavetable);
            }
        };
        this.worker.postMessage({ type: "init", fftSize: fftSize, sampleRate: sampleRate });
    }
    render(harmonics) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(((resolve) => {
                this.tasks.push(resolve);
                this.worker.postMessage({ type: "create", harmonics: harmonics });
            }));
        });
    }
}
//# sourceMappingURL=generator.js.map