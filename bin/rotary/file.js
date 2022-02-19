var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { RotaryModel } from "./model/rotary.js";
import { createRenderConfiguration, RotaryRenderer } from "./render.js";
import { ProgressIndicator } from "../dom/common.js";
const pickerOpts = { types: [{ description: "rotary", accept: { "json/*": [".json"] } }] };
export const open = (model) => __awaiter(void 0, void 0, void 0, function* () {
    let fileHandles;
    try {
        fileHandles = yield window.showOpenFilePicker(pickerOpts);
    }
    catch (e) {
        return;
    }
    if (undefined === fileHandles || 0 === fileHandles.length) {
        return;
    }
    const fileStream = yield fileHandles[0].getFile();
    const text = yield fileStream.text();
    const format = yield JSON.parse(text);
    try {
        new RotaryModel().deserialize(format);
        model.deserialize(format);
    }
    catch (e) {
        console.warn(e);
        alert("Could not load format. Check console for details.");
    }
});
export const save = (model) => __awaiter(void 0, void 0, void 0, function* () {
    let fileHandle;
    try {
        fileHandle = yield window.showSaveFilePicker(pickerOpts);
    }
    catch (e) {
        return;
    }
    if (undefined === fileHandle) {
        return;
    }
    const fileStream = yield fileHandle.createWritable();
    yield fileStream.write(new Blob([JSON.stringify(model.serialize())], { type: "application/json" }));
    yield fileStream.close();
});
export const renderWebM = (model) => __awaiter(void 0, void 0, void 0, function* () {
    const fps = model.exportSettings.fps.get();
    const numFrames = Math.floor(fps * model.duration());
    console.log(`numFrames: ${numFrames}`);
    const writer = new WebMWriter({
        quality: 0.99,
        transparent: true,
        frameRate: fps,
        alphaQuality: 1.0
    });
    const progressIndicator = new ProgressIndicator("Export WebM");
    yield progressIndicator.completeWith(RotaryRenderer.renderFrames(model, model.exportSettings.getConfiguration(numFrames), context => writer.addFrame(context.canvas), progressIndicator.onProgress));
    const blob = yield writer.complete();
    window.open(URL.createObjectURL(blob));
});
export const renderGIF = (model) => __awaiter(void 0, void 0, void 0, function* () {
    const fps = model.exportSettings.fps.get();
    const size = model.exportSettings.size.get();
    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: size,
        height: size,
        workerScript: "lib/gif.worker.js"
    });
    const option = {
        copy: true,
        delay: 1000 / fps
    };
    const numFrames = Math.floor(fps * model.duration());
    const progressIndicator = new ProgressIndicator("Export GIF");
    yield RotaryRenderer.renderFrames(model, model.exportSettings.getConfiguration(numFrames), context => gif.addFrame(context.canvas, option), progress => progressIndicator.onProgress(progress * 0.5));
    gif.once("finished", (blob) => {
        progressIndicator.complete();
        window.open(URL.createObjectURL(blob));
    });
    gif.addListener("progress", progress => progressIndicator.onProgress(0.5 + progress * 0.5));
    gif.render();
});
export const renderPNG = (model) => __awaiter(void 0, void 0, void 0, function* () {
    const frame = RotaryRenderer.iterateFrames(model, createRenderConfiguration({
        numFrames: 1,
        motionFrames: 1,
        fps: 60,
        size: 4096,
        alpha: false
    }));
    const context = frame.next().value;
    context.canvas.toBlob(blob => window.open(URL.createObjectURL(blob)), "image/png", 1);
});
export const renderVideo = (model) => __awaiter(void 0, void 0, void 0, function* () {
    let totalBytes = 0 | 0;
    const buffers = [];
    const encoder = new VideoEncoder({
        output: (chunk, metadata) => {
            totalBytes += chunk.byteLength;
            const arrayBuffer = new Uint8Array(new ArrayBuffer(chunk.byteLength));
            chunk.copyTo(arrayBuffer);
            buffers.push(arrayBuffer);
        },
        error: error => {
            console.log(`error: ${error}`);
        }
    });
    const size = model.exportSettings.size.get();
    const numFrames = Math.floor(60 * 1);
    const progressIndicator = new ProgressIndicator("Export GIF");
    const renderConfiguration = model.exportSettings.getConfiguration(numFrames);
    encoder.configure({
        codec: "vp8",
        width: size,
        height: size,
        alpha: "discard",
        latencyMode: "quality",
        framerate: renderConfiguration.fps
    });
    yield RotaryRenderer.renderFrames(model, renderConfiguration, context => {
        const frame = new VideoFrame(context.canvas);
        encoder.encode(frame);
        frame.close();
    }, progress => progressIndicator.onProgress(progress * 0.5));
    yield progressIndicator.completeWith(encoder.flush());
    const video = new Uint8Array(new ArrayBuffer(totalBytes));
    let write = 0 | 0;
    for (let i = 0; i < buffers.length; i++) {
        const buffer = buffers[i];
        for (let j = 0; j < buffer.byteLength; j++) {
            video[write++] = buffer[j];
        }
    }
});
//# sourceMappingURL=file.js.map