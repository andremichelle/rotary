var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { RotaryRenderer } from "./render.js";
import { ProgressIndicator } from "../dom/common.js";
const pickerOpts = { types: [{ description: "rotary", accept: { "json/*": [".json"] } }] };
export const open = (model) => __awaiter(void 0, void 0, void 0, function* () {
    const fileHandles = yield window.showOpenFilePicker(pickerOpts);
    if (0 === fileHandles.length) {
        return;
    }
    const fileStream = yield fileHandles[0].getFile();
    const text = yield fileStream.text();
    const format = yield JSON.parse(text);
    model.deserialize(format);
});
export const save = (model) => __awaiter(void 0, void 0, void 0, function* () {
    const fileHandle = yield window.showSaveFilePicker(pickerOpts);
    const fileStream = yield fileHandle.createWritable();
    yield fileStream.write(new Blob([JSON.stringify(model.serialize())], { type: "application/json" }));
    yield fileStream.close();
});
export const renderWebM = (model) => __awaiter(void 0, void 0, void 0, function* () {
    const size = model.exportSize.get();
    const numFrames = Math.floor(60 * model.loopDuration.get());
    const writer = new WebMWriter({
        quality: 0.9,
        transparent: true,
        frameRate: 60.0,
        frameDuration: 1000.0 / 60.0,
        alphaQuality: 1.0
    });
    const progressIndicator = new ProgressIndicator("Export WebM");
    yield progressIndicator.completeWith(RotaryRenderer.renderFrames(model, numFrames, size, context => writer.addFrame(context.canvas), progressIndicator.onProgress));
    const blob = yield writer.complete();
    window.open(URL.createObjectURL(blob));
});
export const renderGIF = (model) => __awaiter(void 0, void 0, void 0, function* () {
    const size = model.exportSize.get();
    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: size,
        height: size,
        workerScript: "lib/gif.worker.js"
    });
    const option = {
        copy: true,
        delay: 1000 / 60
    };
    const numFrames = Math.floor(60 * model.loopDuration.get());
    const progressIndicator = new ProgressIndicator("Export GIF");
    yield RotaryRenderer.renderFrames(model, numFrames, size, context => gif.addFrame(context.canvas, option), progress => progressIndicator.onProgress(progress * 0.5));
    gif.once("finished", (blob) => {
        progressIndicator.complete();
        window.open(URL.createObjectURL(blob));
    });
    gif.addListener("progress", progress => progressIndicator.onProgress(0.5 + progress * 0.5));
    gif.render();
});
//# sourceMappingURL=file.js.map