var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ListItem, MenuBar } from "../dom/menu.js";
import { Mulberry32 } from "../lib/math.js";
import { open, renderGIF, renderWebM, save } from "./file.js";
import { encodeWavFloat } from "../dsp/common.js";
const zoomLevel = new Map([
    ["100%", 1.0], ["75%", 0.75], ["66%", 2.0 / 3.0], ["50%", 0.5], ["33%", 1.0 / 3.0], ["25%", 0.25]
]);
export const installApplicationMenu = (element, model, audio, app) => {
    MenuBar.install()
        .offset(0, 0)
        .addButton(element.querySelector("[data-menu='file']"), ListItem.root()
        .addListItem(ListItem.default("Open...", "", false)
        .onTrigger(() => __awaiter(void 0, void 0, void 0, function* () { return open(model); })))
        .addListItem(ListItem.default("Save...", "", false)
        .onTrigger(() => __awaiter(void 0, void 0, void 0, function* () { return save(model); })))
        .addListItem(ListItem.default("Export GIF", "", false)
        .onTrigger(() => renderGIF(model)))
        .addListItem(ListItem.default("Export WebM", "", false)
        .onTrigger(() => renderWebM(model)))
        .addListItem(ListItem.default("Export Wav", "", false)
        .onTrigger(() => __awaiter(void 0, void 0, void 0, function* () {
        const source = yield audio.render();
        const totalFrames = audio.totalFrames;
        const target = [];
        for (let i = 0; i < source.numberOfChannels; i++) {
            target[i] = new Float32Array(totalFrames);
            source.copyFromChannel(target[i], i, source.length - totalFrames);
        }
        const wav = encodeWavFloat({
            channels: target,
            numFrames: totalFrames,
            sampleRate: source.sampleRate
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
    })))
        .addListItem(ListItem.default("Clear", "", false)
        .onTrigger(() => model.clear())))
        .addButton(element.querySelector("[data-menu='edit']"), ListItem.root()
        .addListItem(ListItem.default("Create Track", "", false)
        .onTrigger(() => app.createNew(null, false)))
        .addListItem(ListItem.default("Copy Track", "", false)
        .onOpening(item => item.isSelectable(app.hasSelected()))
        .onTrigger(() => app.createNew(null, true)))
        .addListItem(ListItem.default("Delete Track", "", false)
        .onOpening(item => item.isSelectable(app.hasSelected()))
        .onTrigger(() => app.deleteTrack())))
        .addButton(element.querySelector("[data-menu='randomize']"), ListItem.root()
        .addListItem(ListItem.default("All", "", false)
        .onTrigger(() => model.randomize(new Mulberry32(Math.floor(0x987123F * Math.random())))))
        .addListItem(ListItem.default("Tracks", "", false)
        .onTrigger(() => model.randomizeTracks(new Mulberry32(Math.floor(0x987123F * Math.random())))))
        .addListItem(ListItem.default("Color", "", false)
        .onTrigger(() => __awaiter(void 0, void 0, void 0, function* () { return model.randomizePalette(new Mulberry32(Math.floor(0x987123F * Math.random()))); }))))
        .addButton(element.querySelector("[data-menu='view']"), ListItem.root()
        .addListItem(ListItem.default("Zoom", "", false)
        .addRuntimeChildrenCallback(parent => {
        for (const level of zoomLevel) {
            parent.addListItem(ListItem.default(level[0], "", app.zoom.get() === level[1])
                .onTrigger(() => app.zoom.set(level[1])));
        }
    })))
        .addButton(element.querySelector("[data-menu='help']"), ListItem.root()
        .addListItem(ListItem.default("Open TODOs in Github (protected)", "", false)
        .onTrigger(_ => window.open("https://github.com/andremichelle/rotary/wiki/TODOs"))));
};
//# sourceMappingURL=env.js.map