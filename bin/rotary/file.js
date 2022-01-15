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
export const render = (model) => __awaiter(void 0, void 0, void 0, function* () {
    const canvas = document.createElement("canvas");
    const size = 256;
    const numFrames = 60 * 8;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    const gif = new GIF({
        workers: 4,
        quality: 10,
        width: size,
        height: size,
        workerScript: "lib/gif.worker.js"
    });
    const scale = size / model.measureRadius() * 0.5;
    const renderer = new RotaryRenderer(context, model);
    for (let i = 0; i < numFrames; i++) {
        context.clearRect(0, 0, size, size);
        context.save();
        context.translate(size >> 1, size >> 1);
        context.scale(scale, scale);
        renderer.draw(i / numFrames);
        context.restore();
        gif.addFrame(canvas, { copy: true, delay: 1000 / 60 });
    }
    gif.addListener("progress", progress => console.log(progress));
    gif.once("finished", (blob) => {
        console.log("done", blob);
        window.open(URL.createObjectURL(blob));
    });
    console.log(gif.render());
});
//# sourceMappingURL=file.js.map