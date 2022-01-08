import { CollectionEventType, Terminator } from "../lib/common.js";
import { NumericStepperInput } from "../dom/inputs.js";
import { RotaryTrackEditor } from "./editor.js";
import { Dom, NumericStepper, PrintMapping } from "../dom/common.js";
import { Mulberry32 } from "../lib/math.js";
export class RotaryUI {
    constructor(form, selectors, template, model, renderer) {
        this.form = form;
        this.selectors = selectors;
        this.template = template;
        this.model = model;
        this.renderer = renderer;
        this.terminator = new Terminator();
        this.editor = new RotaryTrackEditor(this, document);
        this.map = new Map();
        this.random = new Mulberry32(0x123abc456);
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='start-radius']"), PrintMapping.integer("px"), new NumericStepper(1))).with(model.radiusMin);
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
            if (0 < this.model.tracks.size() && !this.hasSelected())
                this.select(this.model.tracks.get(0));
        }));
        this.terminator.with(Dom.bindEventListener(form.querySelector("#unshift-new-track"), "click", event => {
            event.preventDefault();
            this.select(this.model.createTrack(0).randomize(this.random));
        }));
        this.model.tracks.forEach(track => this.createSelector(track));
        this.reorderSelectors();
        if (0 < this.model.tracks.size())
            this.select(this.model.tracks.get(0));
    }
    static create(rotary, renderer) {
        const form = document.querySelector("form.track-nav");
        const selectors = form.querySelector("#track-selectors");
        const template = selectors.querySelector("#template-selector-track");
        template.remove();
        return new RotaryUI(form, selectors, template, rotary, renderer);
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
        this.editor.subject.ifPresent(model => {
            const beforeIndex = this.model.tracks.indexOf(model);
            console.assert(-1 !== beforeIndex, "Could not find model");
            this.model.removeTrack(model);
            const numTracks = this.model.tracks.size();
            if (0 < numTracks) {
                this.select(this.model.tracks.get(Math.min(beforeIndex, numTracks - 1)));
            }
            else {
                this.editor.clear();
            }
        });
    }
    select(model) {
        console.assert(model != undefined, "Cannot select");
        this.editor.edit(model);
        const selector = this.map.get(model);
        console.assert(selector != undefined, "Cannot select");
        selector.radio.checked = true;
    }
    hasSelected() {
        return this.editor.subject.nonEmpty();
    }
    showHighlight(model) {
        this.renderer.showHighlight(model);
    }
    releaseHighlight() {
        this.renderer.releaseHighlight();
    }
    createSelector(track) {
        const element = this.template.cloneNode(true);
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
        Dom.emptyNode(this.selectors);
        this.model.tracks.forEach((track, index) => {
            const selector = this.map.get(track);
            console.assert(selector !== undefined, "Cannot reorder selector");
            this.selectors.appendChild(selector.element);
            selector.setIndex(index);
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
        this.terminator.with(Dom.bindEventListener(this.element, "mouseenter", () => this.ui.showHighlight(model)));
        this.terminator.with(Dom.bindEventListener(this.element, "mouseleave", () => this.ui.releaseHighlight()));
        this.terminator.with(Dom.bindEventListener(this.button, "click", (event) => {
            event.preventDefault();
            this.ui.createNew(this.model, event.shiftKey);
        }));
    }
    setIndex(index) {
        this.element.querySelector("span").textContent = String(index + 1);
    }
    terminate() {
        this.element.remove();
        this.terminator.terminate();
    }
}
//# sourceMappingURL=ui.js.map