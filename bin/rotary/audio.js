var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { StereoMeterWorklet } from "../audio/meter/worklet.js";
import { ProgressIndicator } from "../dom/common.js";
import { Boot } from "../lib/common.js";
import { encodeWavFloat } from "../audio/common.js";
import { TransportMessageType } from "../audio/sequencing.js";
import { Metronome } from "../audio/metronome/worklet.js";
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
            yield this.scene.loadModules(this.context);
            yield this.context.audioWorklet.addModule("bin/audio/metronome/processor.js");
            const metronome = new Metronome(this.context);
            const masterMeter = new StereoMeterWorklet(this.context);
            document.getElementById("meter").appendChild(masterMeter.domElement);
            this.model.bpm.addObserver(value => metronome.setBpm(value), true);
            metronome.connect(this.context.destination);
            masterMeter.connect(this.context.destination);
            const boot = new Boot();
            boot.addObserver(boot => {
                const element = document.getElementById("preloader-message");
                if (null !== element) {
                    element.textContent = `${boot.percentage()}% loaded`;
                }
            });
            const preview = yield this.scene.build(this.context, masterMeter, this.model, boot);
            preview.metronome = metronome.enabled;
            const playButton = document.querySelector("[data-parameter='transport']");
            metronome.listenToTransport(preview.transport);
            preview.transport.addObserver((message) => __awaiter(this, void 0, void 0, function* () {
                switch (message.type) {
                    case TransportMessageType.Play: {
                        if (this.context.state !== "running") {
                            yield this.context.resume();
                        }
                        playButton.checked = true;
                        break;
                    }
                    case TransportMessageType.Pause: {
                        playButton.checked = false;
                        break;
                    }
                }
            }), false);
            playButton.onchange = () => __awaiter(this, void 0, void 0, function* () {
                if (playButton.checked) {
                    preview.transport.play();
                }
                else {
                    preview.transport.pause();
                }
            });
            document.querySelector("button.rewind").onclick = () => preview.transport.stop();
            return preview;
        });
    }
    get currentTime() {
        return this.context.currentTime;
    }
    get totalTime() {
        return this.model.duration();
    }
    get totalFrames() {
        return Math.floor(this.model.duration() * Audio.RENDER_SAMPLE_RATE) | 0;
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
            const duration = this.model.duration() * passes;
            console.log(`duration: ${duration}s`);
            const length = Math.floor(Audio.RENDER_SAMPLE_RATE * duration) | 0;
            const offlineAudioContext = new OfflineAudioContext(2, length + Audio.RENDER_SAMPLE_RATE, Audio.RENDER_SAMPLE_RATE);
            const loadingIndicator = new ProgressIndicator("Preparing Export...");
            yield this.scene.loadModules(offlineAudioContext);
            const boot = new Boot();
            boot.addObserver(boot => loadingIndicator.onProgress(boot.normalizedPercentage()));
            const controller = yield loadingIndicator.completeWith(this.scene.build(offlineAudioContext, offlineAudioContext.destination, this.model, boot));
            controller.transport.play();
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
            const bufferOffset = buffer.length - buffer.sampleRate - totalFrames + latencyFrames;
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