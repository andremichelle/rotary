var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { MeterWorklet } from "../dsp/meter/worklet.js";
import { Dom, ProgressIndicator } from "../dom/common.js";
export class Audio {
    constructor(context, scene, model) {
        this.context = context;
        this.scene = scene;
        this.model = model;
    }
    static config(scene, model) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = new AudioContext();
            yield context.suspend();
            yield MeterWorklet.load(context);
            const meter = new MeterWorklet(context);
            Dom.replaceElement(meter.domElement, document.getElementById("meter"));
            meter.connect(context.destination);
            const preview = yield scene.build(context, meter, model, info => {
                const element = document.getElementById("preloader-message");
                if (null !== element) {
                    element.textContent = info;
                }
            });
            const playButton = document.querySelector("[data-parameter='transport']");
            preview.transport.addObserver(moving => playButton.checked = moving);
            playButton.onchange = () => __awaiter(this, void 0, void 0, function* () {
                if (playButton.checked) {
                    if (context.state !== "running") {
                        yield context.resume();
                    }
                    preview.transport.set(true);
                }
                else {
                    preview.transport.set(false);
                }
            });
            document.querySelector("button.rewind").onclick = () => preview.rewind();
            return [new Audio(context, scene, model), preview];
        });
    }
    get currentTime() {
        return this.context.currentTime;
    }
    get totalTime() {
        return this.model.loopDuration.get();
    }
    get totalFrames() {
        return Math.floor(this.model.loopDuration.get() * Audio.RENDER_SAMPLE_RATE) | 0;
    }
    render(passes = 2 | 0) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.context.suspend();
            const duration = this.model.loopDuration.get() * passes;
            const offlineAudioContext = new OfflineAudioContext(2, Math.floor(Audio.RENDER_SAMPLE_RATE * duration) | 0, Audio.RENDER_SAMPLE_RATE);
            const loadingIndicator = new ProgressIndicator("Export Audio...");
            const terminable = yield loadingIndicator.completeWith(this.scene.build(offlineAudioContext, offlineAudioContext.destination, this.model, info => {
                console.debug(info);
            }));
            const exportIndicator = new ProgressIndicator("Exporting Audio");
            const watch = () => {
                exportIndicator.onProgress(offlineAudioContext.currentTime / duration);
                if (offlineAudioContext.state === "running") {
                    requestAnimationFrame(watch);
                }
            };
            requestAnimationFrame(watch);
            const buffer = yield exportIndicator.completeWith(offlineAudioContext.startRendering());
            terminable.terminate();
            return buffer;
        });
    }
}
Audio.RENDER_SAMPLE_RATE = 48000 | 0;
//# sourceMappingURL=audio.js.map