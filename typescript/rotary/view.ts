import {NumericStepper, PrintMapping, Terminable, Terminator} from "../lib/common"
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
    static create(document: Document, rotary: RotaryModel): RotarySelector {
        const form = document.querySelector("form.track-nav") as HTMLFormElement
        const selectors = form.querySelector("#track-selectors")
        const template = selectors.querySelector("#template-selector-track")
        template.remove()
        return new RotarySelector(form, selectors, template, rotary)
    }

    private readonly terminator: Terminator = new Terminator()
    private readonly map: Map<RotaryTrackModel, RotaryTrackSelector> = new Map()
    private readonly editor: RotaryTrackEditor

    constructor(private readonly form: HTMLFormElement,
                private readonly selectors: Node,
                private readonly template: Element,
                private readonly model: RotaryModel) {
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='start-radius']"),
            PrintMapping.integer("px"), new NumericStepper(1))).withValue(model.radiusMin)

        this.editor = new RotaryTrackEditor(this, document)

        form.querySelector("#unshift-new-track").addEventListener("click",
            event => {
                event.preventDefault()
                const model = this.model.createTrack(0)
                model.randomize()
                this.createSelector(model)
                this.updateOrder()
                this.select(model)
            })

        model.tracks.forEach(track => this.createSelector(track))
        if (0 < model.tracks.length) {
            this.select(model.tracks[0])
        }
        this.updateOrder()
    }

    createSelector(trackModel: RotaryTrackModel): void {
        const element = this.template.cloneNode(true) as HTMLElement
        const radio = element.querySelector("input[type=radio]") as HTMLInputElement
        const button = element.querySelector("button") as HTMLButtonElement
        this.map.set(trackModel, new RotaryTrackSelector(this, trackModel, element, radio, button))
    }

    select(model: RotaryTrackModel) {
        this.editor.edit(model)
        this.map.get(model).radio.checked = true
    }

    createNew(model: RotaryTrackModel, copy: boolean) {
        const index = this.model.tracks.indexOf(model)
        console.assert(-1 !== index, "could find model")
        const newModel = copy
            ? this.model.copyTrack(model, index + 1)
            : this.model.createTrack(index + 1)
        newModel.randomize()
        this.createSelector(newModel)
        this.updateOrder()
        this.select(newModel)
    }

    delete(model: RotaryTrackModel): void {
        const index = this.model.tracks.indexOf(model)
        this.map.get(model).terminate()
        this.map.delete(model)
        this.model.removeTrack(model)
        this.updateOrder()
        const numTracks = this.model.tracks.length
        if (0 < numTracks) {
            this.select(this.model.tracks[Math.min(index, numTracks - 1)])
        } else {
            this.editor.clear()
        }
    }

    updateOrder(): void {
        Dom.emptyNode(this.selectors)
        this.model.tracks.forEach(track => this.selectors.appendChild(this.map.get(track).element))
    }
}