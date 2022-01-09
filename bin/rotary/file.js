var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
export const render = () => __awaiter(void 0, void 0, void 0, function* () {
    const chunks = [];
    let bytesTotal = 0 | 0;
    const encoder = new VideoEncoder({
        output: ((chunk, metadata) => {
            console.log(chunk, metadata);
            chunks.push(chunk);
            bytesTotal += chunk.byteLength;
        }),
        error: (error) => {
            console.warn(error);
        }
    });
    encoder.configure({
        width: 512,
        height: 512,
        codec: "vp8"
    });
    console.log(`encoder.state = ${encoder.state}`);
    console.log("create canvas");
    const canvas = document.querySelector("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d", { alpha: true });
    context.fillStyle = "red";
    context.fillRect(64, 64, 64, 64);
    console.log(`flush encodeQueueSize: ${encoder.encodeQueueSize}`);
    encoder.encode(new VideoFrame(canvas));
    context.fillStyle = "green";
    context.fillRect(96, 96, 64, 64);
    console.log(`flush encodeQueueSize: ${encoder.encodeQueueSize}`);
    encoder.encode(new VideoFrame(canvas));
    yield encoder.flush();
    console.log(`flushed encodeQueueSize: ${encoder.encodeQueueSize}`);
    console.log("close");
    encoder.close();
    const bytes = new Uint8Array(bytesTotal);
    const view = new DataView(bytes.buffer);
    for (const chunk of chunks) {
        chunk.copyTo(view);
    }
    console.log(bytes);
    alert("Not yet implemented");
});
//# sourceMappingURL=file.js.map