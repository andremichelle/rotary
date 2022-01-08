var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { RotaryModel } from "./rotary/model.js";
import { RotaryUI } from "./rotary/ui.js";
import { RotaryRenderer } from "./rotary/render.js";
import { Mulberry32 } from "./lib/math.js";
import { pulsarDelay } from "./lib/dsp.js";
import { CollectionEventType, readAudio } from "./lib/common.js";
import { exportVideo } from "./rotary/export.js";
import { ListItem, MenuBar } from "./dom/menu.js";
(() => __awaiter(void 0, void 0, void 0, function* () {
    const canvas = document.querySelector("canvas");
    const labelSize = document.querySelector("label.size");
    const c2D = canvas.getContext("2d", { alpha: true });
    const model = new RotaryModel().randomize(new Mulberry32(Math.floor(0x987123F * Math.random())));
    const renderer = new RotaryRenderer(c2D, model);
    const ui = RotaryUI.create(model, renderer);
    const pickerOpts = { types: [{ description: "rotary", accept: { "json/*": [".json"] } }] };
    const nav = document.querySelector("nav#app-menu");
    MenuBar.install()
        .offset(0, 0)
        .addButton(nav.querySelector("[data-menu='file']"), ListItem.root()
        .addListItem(ListItem.default("Open...", "", false)
        .onTrigger(() => __awaiter(void 0, void 0, void 0, function* () {
        const fileHandles = yield window.showOpenFilePicker(pickerOpts);
        if (0 === fileHandles.length) {
            return;
        }
        const fileStream = yield fileHandles[0].getFile();
        const text = yield fileStream.text();
        const format = yield JSON.parse(text);
        model.deserialize(format);
    })))
        .addListItem(ListItem.default("Save...", "", false)
        .onTrigger(() => __awaiter(void 0, void 0, void 0, function* () {
        const fileHandle = yield window.showSaveFilePicker(pickerOpts);
        const fileStream = yield fileHandle.createWritable();
        yield fileStream.write(new Blob([JSON.stringify(model.serialize())], { type: "application/json" }));
        yield fileStream.close();
    })))
        .addListItem(ListItem.default("Export", "", false)
        .onTrigger(() => exportVideo()))
        .addListItem(ListItem.default("Clear", "", false)
        .onTrigger(() => model.clear()))
        .addListItem(ListItem.default("Randomize", "", false)
        .onTrigger(() => model.randomize(new Mulberry32(Math.floor(0x987123F * Math.random())))))
        .addListItem(ListItem.default("Randomize Track(s)", "", false)
        .onTrigger(() => model.randomizeTracks(new Mulberry32(Math.floor(0x987123F * Math.random()))))))
        .addButton(nav.querySelector("[data-menu='edit']"), ListItem.root()
        .addListItem(ListItem.default("Create Track", "", false)
        .onTrigger(() => {
        ui.createNew(null, false);
    }))
        .addListItem(ListItem.default("Copy Track", "", false)
        .onOpening(item => item.isSelectable(ui.hasSelected()))
        .onTrigger(() => {
        ui.createNew(null, true);
    }))
        .addListItem(ListItem.default("Delete Track", "", false)
        .onOpening(item => item.isSelectable(ui.hasSelected()))
        .onTrigger(() => {
        ui.deleteTrack();
    })))
        .addButton(nav.querySelector("[data-menu='view']"), ListItem.root()
        .addListItem(ListItem.default("Nothing yet", "", false)))
        .addButton(nav.querySelector("[data-menu='help']"), ListItem.root()
        .addListItem(ListItem.default("Nothing yet", "", false)));
    const progressIndicator = document.getElementById("progress");
    const radiant = parseInt(progressIndicator.getAttribute("r"), 10) * 2.0 * Math.PI;
    progressIndicator.setAttribute("stroke-dasharray", radiant.toFixed(2));
    const setProgress = value => progressIndicator.setAttribute("stroke-dashoffset", ((1.0 - value) * radiant).toFixed(2));
    const loopInSeconds = 8.0;
    const context = new AudioContext();
    yield context.suspend();
    yield context.audioWorklet.addModule("bin/worklets/rotary.js");
    const rotaryNode = new AudioWorkletNode(context, "rotary", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
        channelCount: 1,
        channelCountMode: "explicit",
        channelInterpretation: "speakers"
    });
    const updateAll = () => {
        rotaryNode.port.postMessage({
            action: "format",
            value: model.serialize()
        });
    };
    rotaryNode.port.postMessage({
        action: "loopInSeconds",
        value: loopInSeconds
    });
    const observer = () => updateAll();
    const observers = new Map();
    model.tracks.forEach((track, index) => observers.set(track, track.addObserver(observer)));
    model.tracks.addObserver((event) => {
        if (event.type === CollectionEventType.Add) {
            observers.set(event.item, event.item.addObserver(observer));
        }
        else if (event.type === CollectionEventType.Remove) {
            const observer = observers.get(event.item);
            console.assert(observer !== undefined);
            observers.delete(event.item);
            observer.terminate();
        }
        else if (event.type === CollectionEventType.Order) {
        }
        updateAll();
    });
    updateAll();
    const convolverNode = context.createConvolver();
    convolverNode.normalize = false;
    readAudio(context, "../impulse/Large Wide Echo Hall.ogg").then(buffer => convolverNode.buffer = buffer);
    pulsarDelay(context, rotaryNode, convolverNode, 0.500, 0.750, 0.250, 0.2, 20000.0, 20.0);
    const wetGain = context.createGain();
    wetGain.gain.value = 0.5;
    convolverNode.connect(wetGain).connect(context.destination);
    rotaryNode.connect(context.destination);
    const playButton = document.querySelector("[data-parameter='transport']");
    playButton.onchange = () => __awaiter(void 0, void 0, void 0, function* () {
        if (playButton.checked)
            yield context.resume();
        else
            yield context.suspend();
    });
    console.log("ready...");
    let prevTime = NaN;
    const enterFrame = (time) => {
        if (!isNaN(prevTime)) {
        }
        prevTime = time;
        let progress = context.currentTime / loopInSeconds;
        progress -= Math.floor(progress);
        const size = model.measureRadius() * 2;
        const ratio = Math.ceil(devicePixelRatio);
        canvas.width = size * ratio;
        canvas.height = size * ratio;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        labelSize.textContent = `${size}`;
        c2D.clearRect(0.0, 0.0, size, size);
        c2D.save();
        c2D.scale(ratio, ratio);
        c2D.translate(size >> 1, size >> 1);
        renderer.draw(progress);
        c2D.restore();
        setProgress(progress);
        requestAnimationFrame(enterFrame);
    };
    requestAnimationFrame(enterFrame);
}))();
//# sourceMappingURL=main.js.map