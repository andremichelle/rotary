import {CollectionEvent, CollectionEventType, NumericStepper, PrintMapping, Terminable, Terminator} from "../lib/common"
import {RotaryModel, RotaryTrackModel} from "./model"
import {NumericStepperInput} from "../dom/inputs"
import {RotaryTrackEditor, RotaryTrackEditorExecutor} from "./editor"
import {Dom} from "../dom/common";

class RotaryTrackSelector implements Terminable {
    private readonly terminator = new Terminator()

    constructor(readonly selector: RotarySelector,
                readonly model: RotaryTrackModel,
                readonly element: HTMLElement,
                readonly radio: HTMLInputElement,
                readonly button: HTMLButtonElement) {
        this.terminator.with(Dom.bindEventListener(this.radio, "change",
            () => this.selector.select(this.model)))
        this.terminator.with(Dom.bindEventListener(this.button, "click",
            (event: MouseEvent) => {
                event.preventDefault()
                this.selector.createNew(this.model, event.shiftKey)
            }))
    }

    terminate(): void {
        this.element.remove()
        this.terminator.terminate()
    }
}

export class RotarySelector implements RotaryTrackEditorExecutor {
    static create(rotary: RotaryModel): RotarySelector {
        const form = document.querySelector("form.track-nav") as HTMLFormElement
        const selectors = form.querySelector("#track-selectors")
        const template = selectors.querySelector("#template-selector-track")
        template.remove()
        return new RotarySelector(form, selectors, template, rotary)
    }

    private readonly terminator: Terminator = new Terminator()
    private readonly editor = new RotaryTrackEditor(this, document)
    private readonly map: Map<RotaryTrackModel, RotaryTrackSelector> = new Map()

    constructor(private readonly form: HTMLFormElement,
                private readonly selectors: Element,
                private readonly template: Element,
                private readonly model: RotaryModel) {
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='start-radius']"),
            PrintMapping.integer("px"), new NumericStepper(1))).withValue(model.radiusMin)
        this.terminator.with(model.tracks.addObserver((event: CollectionEvent<RotaryTrackModel>) => {
            switch (event.type) {
                case CollectionEventType.Add: {
                    this.createSelector(event.item, event.index)
                    break
                }
                case CollectionEventType.Remove: {
                    this.removeSelector(event.item)
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
            this.select(this.model.createTrack(0).randomize())
        }))
        this.model.tracks.forEach(track => this.createSelector(track))
        if (0 < this.model.tracks.size()) this.select(this.model.tracks.get(0))
    }

    select(model: RotaryTrackModel): void {
        console.assert(model != undefined, "Cannot select")
        this.editor.edit(model)
        const selector = this.map.get(model)
        console.assert(selector != undefined, "Cannot select")
        selector.radio.checked = true
    }

    createNew(model: RotaryTrackModel, copy: boolean) {
        const index = this.model.tracks.indexOf(model)
        console.assert(-1 !== index, "Could not find model")
        const newModel = copy
            ? this.model.copyTrack(model, index + 1)
            : this.model.createTrack(index + 1).randomize()
        this.select(newModel)
    }

    delete(model: RotaryTrackModel): void {
        const beforeIndex = this.model.tracks.indexOf(model)
        console.assert(-1 !== beforeIndex, "Could not find model")
        this.model.removeTrack(model)
        const numTracks = this.model.tracks.size()
        if (0 < numTracks) {
            this.select(this.model.tracks.get(Math.min(beforeIndex, numTracks - 1)))
        } else {
            this.editor.clear()
        }
    }

    private createSelector(track: RotaryTrackModel, index: number = Number.MAX_SAFE_INTEGER): void {
        const element = this.template.cloneNode(true) as HTMLElement
        const radio = element.querySelector("input[type=radio]") as HTMLInputElement
        const button = element.querySelector("button") as HTMLButtonElement
        this.map.set(track, new RotaryTrackSelector(this, track, element, radio, button))
        Dom.insertElement(this.selectors, element, index)
    }

    private removeSelector(track: RotaryTrackModel): void {
        const selector = this.map.get(track)
        const deleted = this.map.delete(track)
        console.assert(selector !== undefined && deleted, "Cannot remove selector")
        selector.terminate()
    }

    private reorderSelectors(): void {
        Dom.emptyNode(this.selectors)
        this.model.tracks.forEach(track => {
            const selector = this.map.get(track)
            console.assert(selector !== undefined, "Cannot reorder selector")
            this.selectors.appendChild(selector.element)
        })
    }
}