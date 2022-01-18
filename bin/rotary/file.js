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
export const renderGIF = (model) => __awaiter(void 0, void 0, void 0, function* () {
    const size = 256;
    const gif = new GIF({
        workers: 8,
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
    yield RotaryRenderer.renderFrames(model, numFrames, size, canvas => gif.addFrame(canvas, option), progress => console.log(progress));
    gif.once("finished", (blob) => {
        console.log("done", blob);
        window.open(URL.createObjectURL(blob));
    });
    gif.addListener("progress", progress => console.log(progress));
    gif.render();
});
//# sourceMappingURL=file.js.map