import { CollectionEventType, NumericStepper, ObservableValueImpl, PrintMapping, TAU, Terminator } from "../lib/common.js";
import { NumericStepperInput } from "../dom/inputs.js";
import { RotaryTrackEditor } from "./editor.js";
import { Dom } from "../dom/common.js";
import { RotaryRenderer } from "./render.js";
import { Mulberry32 } from "../lib/math.js";
export class RotaryApp {
    constructor(model, elements) {
        this.model = model;
        this.elements = elements;
        this.terminator = new Terminator();
        this.editor = new RotaryTrackEditor(this, document.querySelector(".editing"));
        this.map = new Map();
        this.random = new Mulberry32(0x123abc456);
        this.liveContext = this.elements.canvas.getContext("2d", { alpha: true });
        this.rawCanvas = document.createElement("canvas");
        this.rawContext = this.rawCanvas.getContext("2d", { alpha: true });
        this.zoom = new ObservableValueImpl(0.75);
        this.elements.template.remove();
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='start-radius']"), PrintMapping.integer("px"), new NumericStepper(1))).with(model.radiusMin);
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='phase-offset']"), PrintMapping.UnipolarPercent, new NumericStepper(0.01))).with(model.phaseOffset);
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='export-size']"), PrintMapping.integer("px"), new NumericStepper(1))).with(model.exportSize);
        this.terminator.with(model.tracks.addObserver((event) => {
            switch (event.type) {
                case CollectionEventType.Add: {
                    this.createSelector(event.item);
                    this.reorderSelectors();
                    break;
                }
                case CollectionEventType.Remove: {
                    this.removeSelector(event.item);
                    this.reorderSelectors();
                    break;
                }
                case CollectionEventType.Order: {
                    this.reorderSelectors();
                    break;
                }
            }
            if (!this.hasSelected())
                this.model.tracks.first().ifPresent(track => this.select(track));
        }));
        this.terminator.with(Dom.bindEventListener(elements.form.querySelector("#unshift-new-track"), "click", event => {
            event.preventDefault();
            this.select(this.model.createTrack(0).randomize(this.random));
        }));
        const zoomObserver = () => this.elements.labelZoom.textContent = `${Math.floor(this.zoom.get() * 100.0)}`;
        this.terminator.with(this.zoom.addObserver(zoomObserver));
        zoomObserver();
        this.model.tracks.forEach(track => this.createSelector(track));
        this.reorderSelectors();
        this.model.tracks.first().ifPresent(track => this.select(track));
    }
    static create(rotary) {
        return new RotaryApp(rotary, {
            form: document.querySelector("form.track-nav"),
            selectors: document.querySelector("#track-selectors"),
            template: document.querySelector("#template-selector-track"),
            canvas: document.querySelector(".rotary canvas"),
            labelSize: document.querySelector("label.size"),
            labelZoom: document.querySelector("label.zoom"),
            progressIndicator: document.getElementById("progress")
        });
    }
    createNew(model, copy) {
        if (this.editor.subject.isEmpty()) {
            this.select(this.model.createTrack(0).randomize(this.random));
            return;
        }
        model = null === model ? this.editor.subject.get() : model;
        const index = this.model.tracks.indexOf(model);
        console.assert(-1 !== index, "Could not find model");
        const newModel = copy
            ? this.model.copyTrack(model, index + 1)
            : this.model.createTrack(index + 1).randomize(this.random);
        this.select(newModel);
    }
    deleteTrack() {
        this.editor.subject.ifPresent(track => {
            const beforeIndex = this.model.tracks.indexOf(track);
            console.assert(-1 !== beforeIndex, "Could not find model");
            this.model.removeTrack(track);
            const numTracks = this.model.tracks.size();
            if (0 < numTracks) {
                this.select(this.model.tracks.get(Math.min(beforeIndex, numTracks - 1)));
            }
            else {
                this.editor.clear();
            }
        });
    }
    select(track) {
        console.assert(track != undefined, "Cannot select");
        this.editor.edit(track);
        const selector = this.map.get(track);
        console.assert(selector != undefined, "Cannot select");
        selector.radio.checked = true;
    }
    hasSelected() {
        return this.editor.subject.nonEmpty();
    }
    render(phase) {
        const zoom = this.zoom.get();
        const radius = this.model.measureRadius();
        const size = (radius + 64) * 2;
        const ratio = Math.ceil(devicePixelRatio) * zoom;
        this.rawCanvas.width = this.elements.canvas.width = size * ratio;
        this.rawCanvas.height = this.elements.canvas.height = size * ratio;
        this.elements.canvas.style.width = `${size * zoom}px`;
        this.elements.canvas.style.height = `${size * zoom}px`;
        this.elements.labelSize.textContent = `${size}`;
        this.rawContext.save();
        this.rawContext.scale(ratio, ratio);
        this.rawContext.translate(size >> 1, size >> 1);
        const angle = this.model.phaseOffset.get() * TAU;
        const rof = radius + 12.0;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        this.rawContext.fillStyle = this.model.intersects(phase) ? "rgba(255, 255, 255, 0.75)" : "rgba(255, 255, 255, 0.25)";
        this.rawContext.beginPath();
        this.rawContext.arc(cos * rof, sin * rof, 3.0, 0.0, TAU, false);
        this.rawContext.fill();
        const fps = 60.0;
        const subFrames = 16;
        const offset = 1.0 / (this.model.loopDuration.get() * fps * subFrames);
        for (let i = 0; i < subFrames; i++) {
            RotaryRenderer.render(this.rawContext, this.model, phase + offset * i, 1.0 / subFrames);
        }
        this.rawContext.restore();
        this.liveContext.save();
        this.liveContext.filter = "blur(32px) brightness(50%)";
        this.liveContext.drawImage(this.rawCanvas, 0, 0);
        this.liveContext.restore();
        this.liveContext.drawImage(this.rawCanvas, 0, 0);
        const circle = this.elements.progressIndicator;
        const radiant = parseInt(circle.getAttribute("r"), 10) * 2.0 * Math.PI;
        circle.setAttribute("stroke-dasharray", radiant.toFixed(2));
        circle.setAttribute("stroke-dashoffset", ((1.0 - phase) * radiant).toFixed(2));
    }
    createSelector(track) {
        const element = this.elements.template.cloneNode(true);
        const radio = element.querySelector("input[type=radio]");
        const button = element.querySelector("button");
        const selector = new RotaryTrackSelector(this, track, element, radio, button);
        this.map.set(track, selector);
    }
    removeSelector(track) {
        const selector = this.map.get(track);
        const deleted = this.map.delete(track);
        console.assert(selector !== undefined && deleted, "Cannot remove selector");
        selector.terminate();
        if (this.editor.subject.contains(track))
            this.editor.clear();
    }
    reorderSelectors() {
        Dom.emptyNode(this.elements.selectors);
        this.model.tracks.forEach((track) => {
            const selector = this.map.get(track);
            console.assert(selector !== undefined, "Cannot reorder selector");
            this.elements.selectors.appendChild(selector.element);
        });
    }
}
export class RotaryTrackSelector {
    constructor(ui, model, element, radio, button) {
        this.ui = ui;
        this.model = model;
        this.element = element;
        this.radio = radio;
        this.button = button;
        this.terminator = new Terminator();
        this.terminator.with(Dom.bindEventListener(this.radio, "change", () => this.ui.select(this.model)));
        this.terminator.with(Dom.bindEventListener(this.button, "click", (event) => {
            event.preventDefault();
            this.ui.createNew(this.model, event.shiftKey);
        }));
        this.canvas = this.element.querySelector("canvas");
        this.context = this.canvas.getContext("2d");
        this.terminator.with(this.model.addObserver(() => this.updatePreview()));
        requestAnimationFrame(() => this.updatePreview());
    }
    updatePreview() {
        const ratio = Math.ceil(devicePixelRatio);
        const w = this.canvas.width = this.canvas.clientWidth * ratio;
        const h = this.canvas.height = this.canvas.clientHeight * ratio;
        if (w === 0 || h === 0)
            return;
        RotaryRenderer.renderTrackPreview(this.context, this.model, Math.max(w, h));
    }
    terminate() {
        this.element.remove();
        this.terminator.terminate();
    }
}
//# sourceMappingURL=app.js.map