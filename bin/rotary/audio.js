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
import { ProgressIndicator } from "../dom/common.js";
import { encodeWavFloat } from "../dsp/common.js";
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
            return new Audio(context, scene, model);
        });
    }
    initPreview() {
        return __awaiter(this, void 0, void 0, function* () {
            yield MeterWorklet.load(this.context);
            const meter = new MeterWorklet(this.context);
            document.getElementById("meter").appendChild(meter.domElement);
            meter.connect(this.context.destination);
            const preview = yield this.scene.build(this.context, meter, this.model, info => {
                const element = document.getElementById("preloader-message");
                if (null !== element) {
                    element.textContent = info;
                }
            });
            const playButton = document.querySelector("[data-parameter='transport']");
            preview.transport.addObserver(moving => playButton.checked = moving);
            playButton.onchange = () => __awaiter(this, void 0, void 0, function* () {
                if (playButton.checked) {
                    if (this.context.state !== "running") {
                        yield this.context.resume();
                    }
                    preview.transport.set(true);
                }
                else {
                    preview.transport.set(false);
                }
            });
            document.querySelector("button.rewind").onclick = () => preview.rewind();
            return preview;
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
    exportWav(passes = 2 | 0) {
        return __awaiter(this, void 0, void 0, function* () {
            const channels = yield this.render(passes);
            const wav = encodeWavFloat({
                channels: channels,
                numFrames: Math.min(channels[0].length, channels[1].length),
                sampleRate: Audio.RENDER_SAMPLE_RATE
            });
            try {
                const saveFilePicker = yield window.showSaveFilePicker({ suggestedName: "loop.wav" });
                const writableFileStream = yield saveFilePicker.createWritable();
                writableFileStream.write(wav);
                writableFileStream.close();
            }
            catch (e) {
                console.log(`abort with ${e}`);
            }
        });
    }
    render(passes) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.context.suspend();
            const duration = this.model.loopDuration.get() * passes;
            const length = Math.floor(Audio.RENDER_SAMPLE_RATE * duration) | 0;
            const offlineAudioContext = new OfflineAudioContext(2, length + Audio.RENDER_SAMPLE_RATE, Audio.RENDER_SAMPLE_RATE);
            const loadingIndicator = new ProgressIndicator("Preparing Export...");
            const controller = yield loadingIndicator.completeWith(this.scene.build(offlineAudioContext, offlineAudioContext.destination, this.model, info => {
                console.debug(info);
            }));
            controller.transport.set(true);
            const exportIndicator = new ProgressIndicator("Exporting Audio...");
            const watch = () => {
                exportIndicator.onProgress(offlineAudioContext.currentTime / duration);
                if (offlineAudioContext.state === "running") {
                    requestAnimationFrame(watch);
                }
            };
            requestAnimationFrame(watch);
            const buffer = yield exportIndicator.completeWith(offlineAudioContext.startRendering());
            const latencyFrames = Math.ceil(controller.latency() * Audio.RENDER_SAMPLE_RATE) | 0;
            controller.terminate();
            const totalFrames = this.totalFrames;
            const target = [];
            const bufferOffset = buffer.length - totalFrames + latencyFrames;
            for (let i = 0; i < buffer.numberOfChannels; i++) {
                target[i] = new Float32Array(totalFrames);
                buffer.copyFromChannel(target[i], i, bufferOffset);
            }
            return target;
        });
    }
}
Audio.RENDER_SAMPLE_RATE = 48000 | 0;
//# sourceMappingURL=audio.js.map