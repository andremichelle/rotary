import {
    CollectionEvent,
    CollectionEventType,
    NumericStepper,
    ObservableValueImpl,
    PrintMapping,
    Terminable,
    Terminator
} from "../lib/common.js"
import {RotaryModel, RotaryTrackModel} from "./model.js"
import {NumericStepperInput} from "../dom/inputs.js"
import {RotaryTrackEditor, RotaryTrackEditorExecutor} from "./editor.js"
import {Dom} from "../dom/common.js"
import {RotaryRenderer} from "./render.js"
import {Mulberry32, Random} from "../lib/math.js"

export interface DomElements {
    form: HTMLFormElement
    selectors: HTMLElement
    template: HTMLElement
    canvas: HTMLCanvasElement
    labelSize: HTMLLabelElement
    labelZoom: HTMLLabelElement
    progressIndicator: SVGCircleElement
}

export class RotaryApp implements RotaryTrackEditorExecutor {
    static create(rotary: RotaryModel): RotaryApp {
        return new RotaryApp(rotary, {
            form: document.querySelector("form.track-nav") as HTMLFormElement,
            selectors: document.querySelector("#track-selectors"),
            template: document.querySelector("#template-selector-track"),
            canvas: document.querySelector(".rotary canvas"),
            labelSize: document.querySelector("label.size"),
            labelZoom: document.querySelector("label.zoom"),
            progressIndicator: document.getElementById("progress") as unknown as SVGCircleElement
        })
    }

    private readonly terminator: Terminator = new Terminator()
    private readonly editor = new RotaryTrackEditor(this, document.querySelector(".editing"))
    private readonly map: Map<RotaryTrackModel, RotaryTrackSelector> = new Map()
    private readonly random: Random = new Mulberry32(0x123abc456)
    private readonly c2D: CanvasRenderingContext2D = this.elements.canvas.getContext("2d", {alpha: true})

    readonly zoom = new ObservableValueImpl<number>(0.75)

    private highlight: RotaryTrackModel = null

    private constructor(private readonly model: RotaryModel,
                        private readonly elements: DomElements) {
        this.elements.template.remove()
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='start-radius']"),
            PrintMapping.integer("px"), new NumericStepper(1))).with(model.radiusMin)
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='phase-offset']"),
            PrintMapping.UnipolarPercent, new NumericStepper(0.01))).with(model.phaseOffset)
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='export-size']"),
            PrintMapping.integer("px"), new NumericStepper(1))).with(model.exportSize)
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
            if (!this.hasSelected()) this.model.tracks.first().ifPresent(track => this.select(track))
        }))
        this.terminator.with(Dom.bindEventListener(elements.form.querySelector("#unshift-new-track"), "click", event => {
            event.preventDefault()
            this.select(this.model.createTrack(0).randomize(this.random))
        }))
        const zoomObserver = () => this.elements.labelZoom.textContent = `${Math.floor(this.zoom.get() * 100.0)}`
        this.terminator.with(this.zoom.addObserver(zoomObserver))
        zoomObserver()
        this.model.tracks.forEach(track => this.createSelector(track))
        this.reorderSelectors()
        this.model.tracks.first().ifPresent(track => this.select(track))
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
        this.editor.subject.ifPresent(track => {
            const beforeIndex = this.model.tracks.indexOf(track)
            console.assert(-1 !== beforeIndex, "Could not find model")
            this.model.removeTrack(track)
            const numTracks = this.model.tracks.size()
            if (0 < numTracks) {
                this.select(this.model.tracks.get(Math.min(beforeIndex, numTracks - 1)))
            } else {
                this.editor.clear()
            }
        })
    }

    select(track: RotaryTrackModel): void {
        console.assert(track != undefined, "Cannot select")
        this.editor.edit(track)
        const selector = this.map.get(track)
        console.assert(selector != undefined, "Cannot select")
        selector.radio.checked = true
    }

    hasSelected(): boolean {
        return this.editor.subject.nonEmpty()
    }

    showHighlight(track: RotaryTrackModel): void {
        this.highlight = track
    }

    releaseHighlight(): void {
        this.highlight = null
    }

    render(progress: number = 0.0): void {
        const zoom = this.zoom.get()
        const size = this.model.measureRadius() * 2
        const ratio = Math.ceil(devicePixelRatio) * zoom

        this.elements.canvas.width = size * ratio
        this.elements.canvas.height = size * ratio
        this.elements.canvas.style.width = `${size * zoom}px`
        this.elements.canvas.style.height = `${size * zoom}px`
        this.elements.labelSize.textContent = `${size}`

        this.c2D.save()
        this.c2D.scale(ratio, ratio)
        this.c2D.translate(size >> 1, size >> 1)

        let radiusMin = this.model.radiusMin.get()
        for (let i = 0; i < this.model.tracks.size(); i++) {
            const model = this.model.tracks.get(i)
            this.c2D.globalAlpha = model === this.highlight || null === this.highlight ? 1.0 : 0.25
            RotaryRenderer.renderTrack(this.c2D, model, radiusMin, progress)
            radiusMin += model.width.get() + model.widthPadding.get()
        }
        this.c2D.restore()

        const circle = this.elements.progressIndicator
        const radiant = parseInt(circle.getAttribute("r"), 10) * 2.0 * Math.PI
        circle.setAttribute("stroke-dasharray", radiant.toFixed(2))
        circle.setAttribute("stroke-dashoffset", ((1.0 - progress) * radiant).toFixed(2))
    }

    private createSelector(track: RotaryTrackModel): void {
        const element = this.elements.template.cloneNode(true) as HTMLElement
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
        Dom.emptyNode(this.elements.selectors)
        this.model.tracks.forEach((track) => {
            const selector = this.map.get(track)
            console.assert(selector !== undefined, "Cannot reorder selector")
            this.elements.selectors.appendChild(selector.element)
        })
    }
}

export class RotaryTrackSelector implements Terminable {
    private readonly terminator = new Terminator()
    private readonly canvas: HTMLCanvasElement
    private readonly context: CanvasRenderingContext2D

    constructor(readonly ui: RotaryApp,
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
        this.canvas = this.element.querySelector("canvas")
        this.context = this.canvas.getContext("2d")
        this.terminator.with(this.model.addObserver(() => this.updatePreview()))
        requestAnimationFrame(() => this.updatePreview())
    }

    updatePreview(): void {
        const ratio = Math.ceil(devicePixelRatio)
        const w = this.canvas.width = this.canvas.clientWidth * ratio
        const h = this.canvas.height = this.canvas.clientHeight * ratio
        if (w === 0 || h === 0) return
        this.context.save()
        this.context.translate(w >> 1, h >> 1)
        RotaryRenderer.renderTrack(this.context, this.model, 16.0, 0.0)
        this.context.restore()
    }

    terminate(): void {
        this.element.remove()
        this.terminator.terminate()
    }
}