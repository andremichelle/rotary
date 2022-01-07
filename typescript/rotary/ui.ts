import {CollectionEvent, CollectionEventType, NumericStepper, Terminable, Terminator} from "../lib/common"
import {RotaryModel, RotaryTrackModel} from "./model"
import {NumericStepperInput} from "../dom/inputs"
import {RotaryTrackEditor, RotaryTrackEditorExecutor} from "./editor"
import {Dom} from "../dom/common"
import {RotaryRenderer} from "./render"
import {Mulberry32, Random} from "../lib/math"
import {PrintMapping} from "../lib/mapping"

export class RotaryUI implements RotaryTrackEditorExecutor {
    private readonly terminator: Terminator = new Terminator()
    private readonly editor = new RotaryTrackEditor(this, document)
    private readonly map: Map<RotaryTrackModel, RotaryTrackSelector> = new Map()
    private readonly random: Random = new Mulberry32(0x123abc456)

    constructor(private readonly form: HTMLFormElement,
                private readonly selectors: Element,
                private readonly template: Element,
                private readonly model: RotaryModel,
                private readonly renderer: RotaryRenderer) {
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='start-radius']"),
            PrintMapping.integer("px"), new NumericStepper(1))).with(model.radiusMin)
        this.terminator.with(model.tracks.addObserver((event: CollectionEvent<RotaryTrackModel>) => {
            switch (event.type) {
                case CollectionEventType.Add: {
                    this.createSelector(event.item)
                    this.reorderSelectors()
                    break
                }
                case CollectionEventType.Remove: {
                    this.removeSelector(event.item)
                    this.reorderSelectors()
                    break
                }
                case CollectionEventType.Order: {
                    this.reorderSelectors()
                    break
                }
            }
        }))
        this.terminator.with(Dom.bindEventListener(form.querySelector("#unshift-new-track"), "click", event => {
            event.preventDefault()
            this.select(this.model.createTrack(0).randomize(this.random))
        }))
        this.model.tracks.forEach(track => this.createSelector(track))
        this.reorderSelectors()
        if (0 < this.model.tracks.size()) this.select(this.model.tracks.get(0))
    }

    static create(rotary: RotaryModel, renderer: RotaryRenderer): RotaryUI {
        const form = document.querySelector("form.track-nav") as HTMLFormElement
        const selectors = form.querySelector("#track-selectors")
        const template = selectors.querySelector("#template-selector-track")
        template.remove()
        return new RotaryUI(form, selectors, template, rotary, renderer)
    }

    createNew(model: RotaryTrackModel | null, copy: boolean) {
        if (this.editor.subject.isEmpty()) {
            this.select(this.model.createTrack(0).randomize(this.random))
            return
        }
        model = null === model ? this.editor.subject.get() : model
        const index = this.model.tracks.indexOf(model)
        console.assert(-1 !== index, "Could not find model")
        const newModel = copy
            ? this.model.copyTrack(model, index + 1)
            : this.model.createTrack(index + 1).randomize(this.random)
        this.select(newModel)
    }

    deleteTrack(): void {
        this.editor.subject.ifPresent(model => {
            const beforeIndex = this.model.tracks.indexOf(model)
            console.assert(-1 !== beforeIndex, "Could not find model")
            this.model.removeTrack(model)
            const numTracks = this.model.tracks.size()
            if (0 < numTracks) {
                this.select(this.model.tracks.get(Math.min(beforeIndex, numTracks - 1)))
            } else {
                this.editor.clear()
            }
        })
    }

    select(model: RotaryTrackModel): void {
        console.assert(model != undefined, "Cannot select")
        this.editor.edit(model)
        const selector = this.map.get(model)
        console.assert(selector != undefined, "Cannot select")
        selector.radio.checked = true
    }

    hasSelected(): boolean {
        return this.editor.subject.nonEmpty()
    }

    showHighlight(model: RotaryTrackModel): void {
        this.renderer.showHighlight(model)
    }

    releaseHighlight(): void {
        this.renderer.releaseHighlight()
    }

    private createSelector(track: RotaryTrackModel): void {
        const element = this.template.cloneNode(true) as HTMLElement
        const radio = element.querySelector("input[type=radio]") as HTMLInputElement
        const button = element.querySelector("button") as HTMLButtonElement
        const selector = new RotaryTrackSelector(this, track, element, radio, button)
        this.map.set(track, selector)
    }

    private removeSelector(track: RotaryTrackModel): void {
        const selector = this.map.get(track)
        const deleted = this.map.delete(track)
        console.assert(selector !== undefined && deleted, "Cannot remove selector")
        selector.terminate()
        if (this.editor.subject.contains(track)) this.editor.clear()
    }

    private reorderSelectors(): void {
        Dom.emptyNode(this.selectors)
        this.model.tracks.forEach((track, index) => {
            const selector = this.map.get(track)
            console.assert(selector !== undefined, "Cannot reorder selector")
            this.selectors.appendChild(selector.element)
            selector.setIndex(index)
        })
    }
}

export class RotaryTrackSelector implements Terminable {
    private readonly terminator = new Terminator()

    constructor(readonly ui: RotaryUI,
                readonly model: RotaryTrackModel,
                readonly element: HTMLElement,
                readonly radio: HTMLInputElement,
                readonly button: HTMLButtonElement) {
        this.terminator.with(Dom.bindEventListener(this.radio, "change",
            () => this.ui.select(this.model)))
        this.terminator.with(Dom.bindEventListener(this.element, "mouseenter",
            () => this.ui.showHighlight(model)))
        this.terminator.with(Dom.bindEventListener(this.element, "mouseleave",
            () => this.ui.releaseHighlight()))
        this.terminator.with(Dom.bindEventListener(this.button, "click",
            (event: MouseEvent) => {
                event.preventDefault()
                this.ui.createNew(this.model, event.shiftKey)
            }))
    }

    setIndex(index: number): void {
        this.element.querySelector("span").textContent = String(index + 1)
    }

    terminate(): void {
        this.element.remove()
        this.terminator.terminate()
    }
}