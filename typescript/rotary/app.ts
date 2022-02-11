import {
    CollectionEvent,
    CollectionEventType,
    NumericStepper,
    ObservableValueImpl,
    PrintMapping,
    Terminable,
    Terminator
} from "../lib/common.js"
import {Checkbox} from "../dom/inputs.js"
import {RotaryTrackEditor, RotaryTrackEditorExecutor} from "./editor.js"
import {Dom} from "../dom/common.js"
import {RotaryRenderer} from "./render.js"
import {Mulberry32, Random, TAU} from "../lib/math.js"
import {ListItem, MenuBar} from "../dom/menu.js"
import {open, renderGIF, renderVideo, renderWebM, save} from "./file.js"
import {Audio, AudioSceneController} from "./audio.js"
import {TypeSwitchEditor, UIControllerLayout} from "../dom/controls.js"
import {CompositeSettingsUIBuilder} from "../audio/composite.js"
import {RotaryModel} from "./model/rotary"
import {RotaryTrackModel} from "./model/track"

const zoomLevel: Map<string, number> = new Map([
    ["100%", 1.0], ["75%", 0.75], ["66%", 2.0 / 3.0], ["50%", 0.5], ["33%", 1.0 / 3.0], ["25%", 0.25]
])

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
    static FPS: number = 60.0

    static create(rotary: RotaryModel, preview: AudioSceneController): RotaryApp {
        return new RotaryApp(rotary, preview, {
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
    private readonly liveContext: CanvasRenderingContext2D = this.elements.canvas.getContext("2d", {alpha: true})
    private readonly rawCanvas: HTMLCanvasElement = document.createElement("canvas")
    private readonly rawContext: CanvasRenderingContext2D = this.rawCanvas.getContext("2d", {alpha: true})

    readonly zoom = new ObservableValueImpl<number>(0.5)

    private constructor(private readonly model: RotaryModel,
                        private readonly preview: AudioSceneController,
                        private readonly elements: DomElements) {
        this.elements.template.remove()

        const globalLayout = this.terminator.with(new UIControllerLayout(document.querySelector(".two-columns.global")))
        globalLayout.createNumericStepper("start radius", PrintMapping.integer("px"),
            new NumericStepper(1)).with(model.radiusMin)
        globalLayout.createNumericStepper("phase offset", PrintMapping.UnipolarPercent,
            new NumericStepper(0.01)).with(model.phaseOffset)
        globalLayout.createNumericStepper("inactive alpha", PrintMapping.UnipolarPercent,
            new NumericStepper(0.01)).with(model.inactiveAlpha)
        globalLayout.createNumericStepper("bpm", PrintMapping.integer(""),
            new NumericStepper(1)).with(model.bpm)
        globalLayout.createNumericStepper("stretch", PrintMapping.integer("x"),
            new NumericStepper(1)).with(model.stretch)
        globalLayout.createNumericStepper("motion blur", PrintMapping.integer(""),
            new NumericStepper(1)).with(model.motion)
        globalLayout.createCheckbox("metronome").with(preview.metronome.enabled)

        const exportLayout = this.terminator.with(new UIControllerLayout(document.querySelector(".two-columns.export")))
        exportLayout.createNumericStepper("size", PrintMapping.integer("px"),
            new NumericStepper(1)).with(model.exportSettings.size)
        exportLayout.createNumericStepper("fps", PrintMapping.integer(""),
            new NumericStepper(1)).with(model.exportSettings.fps)
        exportLayout.createNumericStepper("motion blur", PrintMapping.integer(""),
            new NumericStepper(1)).with(model.exportSettings.subFrames)

        this.terminator.with(new TypeSwitchEditor(document.querySelector("div.two-columns.aux-a"), CompositeSettingsUIBuilder, "Effect")).with(model.aux[0])
        this.terminator.with(new TypeSwitchEditor(document.querySelector("div.two-columns.aux-b"), CompositeSettingsUIBuilder, "Effect")).with(model.aux[1])
        this.terminator.with(new TypeSwitchEditor(document.querySelector("div.two-columns.aux-c"), CompositeSettingsUIBuilder, "Effect")).with(model.aux[2])
        this.terminator.with(new TypeSwitchEditor(document.querySelector("div.two-columns.aux-d"), CompositeSettingsUIBuilder, "Effect")).with(model.aux[3])

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
            this.select(this.model.createTrack(0))
        }))
        const zoomObserver = () => this.elements.labelZoom.textContent = `${Math.floor(this.zoom.get() * 100.0)}`
        this.terminator.with(this.zoom.addObserver(zoomObserver))
        zoomObserver()
        this.model.tracks.forEach(track => this.createSelector(track))
        this.reorderSelectors()
        this.model.tracks.first().ifPresent(track => this.select(track))

        document.onvisibilitychange = () => {
            if (!document.hidden) {
                this.map.forEach(selector => selector.updatePreview())
            }
        }
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
            : this.model.createTrack(index + 1)
        this.select(newModel)
    }

    deleteTrack(trackModel: RotaryTrackModel): void {
        const beforeIndex = this.model.tracks.indexOf(trackModel)
        console.assert(-1 !== beforeIndex, "Could not find model")
        this.model.removeTrack(trackModel)
        const numTracks = this.model.tracks.size()
        if (0 < numTracks) {
            this.select(this.model.tracks.get(Math.min(beforeIndex, numTracks - 1)))
        } else {
            this.editor.clear()
        }
    }

    moveTrackLeft(trackModel: RotaryTrackModel): void {
        const beforeIndex = this.model.tracks.indexOf(trackModel)
        if (0 < beforeIndex) {
            this.model.tracks.move(beforeIndex, beforeIndex - 1)
        }
    }

    moveTrackRight(trackModel: RotaryTrackModel): void {
        const beforeIndex = this.model.tracks.indexOf(trackModel)
        if (beforeIndex < this.model.tracks.size() - 1) {
            this.model.tracks.move(beforeIndex, beforeIndex + 1)
        }
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

    render(phase: number): void {
        const zoom = this.zoom.get()
        const radius = this.model.measureRadius()
        const size = (radius + 64) * 2
        const ratio = Math.ceil(devicePixelRatio) * zoom

        this.rawCanvas.width = this.elements.canvas.width = size * ratio
        this.rawCanvas.height = this.elements.canvas.height = size * ratio
        this.elements.canvas.style.width = `${size * zoom}px`
        this.elements.canvas.style.height = `${size * zoom}px`
        this.elements.labelSize.textContent = `${size}`

        this.rawContext.save()
        this.rawContext.scale(ratio, ratio)
        this.rawContext.translate(size >> 1, size >> 1)

        const angle = this.model.phaseOffset.get() * TAU
        const rof = radius + 12.0
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        this.rawContext.fillStyle = this.model.intersects(phase) ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.125)"
        this.rawContext.beginPath()
        this.rawContext.arc(cos * rof, sin * rof, 3.0, 0.0, TAU, false)
        this.rawContext.fill()

        const subFrames = this.model.motion.get()
        const alphaMultiplier = 1.0 / subFrames
        const offset = 1.0 / (this.model.duration() * RotaryApp.FPS * subFrames)
        for (let i = 0; i < subFrames; i++) {
            RotaryRenderer.render(this.rawContext, this.model, phase + offset * i, alphaMultiplier)
        }

        this.rawContext.restore()
        this.liveContext.save()
        this.liveContext.filter = "blur(32px) brightness(50%)"
        this.liveContext.drawImage(this.rawCanvas, 0, 0)
        this.liveContext.restore()
        this.liveContext.drawImage(this.rawCanvas, 0, 0)

        const circle = this.elements.progressIndicator
        const radiant = parseInt(circle.getAttribute("r"), 10) * 2.0 * Math.PI
        circle.setAttribute("stroke-dasharray", radiant.toFixed(2))
        circle.setAttribute("stroke-dashoffset", ((1.0 - phase) * radiant).toFixed(2))
    }

    installShortcuts(audio: Audio, preview: AudioSceneController): RotaryApp {
        window.addEventListener("keydown", async (event: KeyboardEvent) => {
            if (event.key === "r" && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
                event.preventDefault()
                this.randomizeAll()
            } else if (event.key === "o" && !event.shiftKey && !event.ctrlKey && event.metaKey) {
                event.preventDefault()
                await open(this.model)
            } else if (event.key === "s" && !event.shiftKey && !event.ctrlKey && event.metaKey) {
                event.preventDefault()
                await save(this.model)
            } else if (event.code === "Space" && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
                event.preventDefault()
                preview.transport.togglePlayback()
            } else if (event.key === "f" && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
                if (document.fullscreenEnabled) {
                    event.preventDefault()
                    await this.toggleFullscreen()
                }
            }
        })
        return this
    }

    installApplicationMenu(audio: Audio): RotaryApp {
        const element = document.querySelector("nav#app-menu")
        MenuBar.install()
            .offset(0, 0)
            .addButton(element.querySelector("[data-menu='file']"), ListItem.root()
                .addListItem(ListItem.default("Open...", "⌘O", false)
                    .onTrigger(async () => open(this.model)))
                .addListItem(ListItem.default("Save...", "⌘S", false)
                    .onTrigger(async () => save(this.model)))
                .addListItem(ListItem.default("Export Video (experimental)", "", false)
                    .onTrigger(() => renderVideo(this.model)))
                .addListItem(ListItem.default("Export GIF", "", false)
                    .onTrigger(() => renderGIF(this.model)))
                .addListItem(ListItem.default("Export WebM", "", false)
                    .onTrigger(() => renderWebM(this.model)))
                .addListItem(ListItem.default("Export Wav", "", false)
                    .onTrigger(async () => audio.exportWav()))
                .addListItem(ListItem.default("Clear", "", false)
                    .onTrigger(() => this.model.clear())))
            .addButton(element.querySelector("[data-menu='edit']"), ListItem.root()
                .addListItem(ListItem.default("Create Track", "", false)
                    .onTrigger(() => this.createNew(null, false)))
                .addListItem(ListItem.default("Copy Track", "", false)
                    .onOpening(item => item.isSelectable(this.hasSelected()))
                    .onTrigger(() => this.createNew(null, true)))
                .addListItem(ListItem.default("Delete Track", "", false)
                    .onOpening(item => item.isSelectable(this.hasSelected()))
                    .onTrigger(() => this.editor.subject.ifPresent(trackModel => this.deleteTrack(trackModel))))
            )
            .addButton(element.querySelector("[data-menu='randomize']"), ListItem.root()
                .addListItem(ListItem.default("All", "R", false)
                    .onTrigger(() => this.randomizeAll()))
                .addListItem(ListItem.default("Tracks", "", false)
                    .onTrigger(() => this.model.randomizeTracks(new Mulberry32(Math.floor(0x987123F * Math.random())))))
                .addListItem(ListItem.default("Color", "", false)
                    .onTrigger(async () => this.model.randomizePalette(new Mulberry32(Math.floor(0x987123F * Math.random())))))
            )
            .addButton(element.querySelector("[data-menu='view']"), ListItem.root()
                .addListItem(ListItem.default("Zoom", "", false)
                    .addRuntimeChildrenCallback(parent => {
                        for (const level of zoomLevel) {
                            parent.addListItem(ListItem.default(level[0], "", this.zoom.get() === level[1])
                                .onTrigger(() => this.zoom.set(level[1])))
                        }
                    }))
                .addListItem(ListItem.default("Enter Full Screen", "F", null !== document.fullscreenElement)
                    .isSelectable(document.fullscreenEnabled)
                    .onTrigger(async () => this.toggleFullscreen())))
            .addButton(element.querySelector("[data-menu='help']"), ListItem.root()
                .addListItem(ListItem.default("Open TODOs in Github (protected)", "", false)
                    .onTrigger(_ => window.open("https://github.com/andremichelle/rotary/wiki/TODOs"))))
        return this
    }

    async toggleFullscreen(): Promise<void> {
        if (!document.fullscreenEnabled) return Promise.resolve()
        if (null === document.fullscreenElement) {
            return this.elements.canvas.requestFullscreen()
        } else {
            return document.exitFullscreen()
        }
    }

    peak(model: RotaryTrackModel): Float32Array {
        return this.preview.meter.peaks[this.model.tracks.indexOf(model)]
    }

    private randomizeAll() {
        return this.model.randomize(new Mulberry32(Math.floor(0x987123F * Math.random())))
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
    private readonly previewCanvas: HTMLCanvasElement
    private readonly previewContext: CanvasRenderingContext2D
    private readonly peaksCanvas: HTMLCanvasElement
    private readonly peaksContext: CanvasRenderingContext2D

    private readonly mute: Checkbox
    private readonly solo: Checkbox

    constructor(readonly app: RotaryApp,
                readonly model: RotaryTrackModel,
                readonly element: HTMLElement,
                readonly radio: HTMLInputElement,
                readonly button: HTMLButtonElement) {
        this.terminator.with(Dom.bindEventListener(this.radio, "change",
            () => this.app.select(this.model)))
        this.terminator.with(Dom.bindEventListener(this.button, "click",
            (event: MouseEvent) => {
                event.preventDefault()
                this.app.createNew(this.model, event.shiftKey)
            }))
        this.previewCanvas = this.element.querySelector("canvas[preview]")
        this.previewContext = this.previewCanvas.getContext("2d")
        this.peaksCanvas = this.element.querySelector("canvas[peaks]")
        this.peaksContext = this.peaksCanvas.getContext("2d")
        this.mute = this.terminator.with(new Checkbox(element.querySelector("label.checkbox.mute input")))
        this.mute.with(this.model.mute)
        this.solo = this.terminator.with(new Checkbox(element.querySelector("label.checkbox.solo input")))
        this.solo.with(this.model.solo)
        this.terminator.with(this.model.addObserver(() => requestAnimationFrame(() => this.updatePreview())))
        requestAnimationFrame(() => this.updatePreview())
        requestAnimationFrame(() => this.updatePeaks())
    }

    updatePreview(): void {
        const ratio = Math.ceil(devicePixelRatio)
        const w = this.previewCanvas.width = this.previewCanvas.clientWidth * ratio
        const h = this.previewCanvas.height = this.previewCanvas.clientHeight * ratio
        if (w === 0 || h === 0) return
        RotaryRenderer.renderTrackPreview(this.previewContext, this.model, Math.max(w, h))
    }

    updatePeaks(): void {
        const ratio = Math.ceil(devicePixelRatio)
        const w = this.peaksCanvas.width = this.peaksCanvas.clientWidth * ratio
        const h = this.peaksCanvas.height = this.peaksCanvas.clientHeight * ratio
        if (w === 0 || h === 0) return

        const [p0, p1] = this.app.peak(this.model)

        this.peaksContext.save()
        this.peaksContext.scale(ratio, ratio)
        this.peaksContext.clearRect(0, 0, w, h)
        this.peaksContext.fillStyle = "#999"
        this.peaksContext.fillRect(1, 16 - p0 * 15, 3, p0 * 15)
        this.peaksContext.fillRect(6, 16 - p1 * 15, 3, p1 * 15)
        this.peaksContext.restore()

        if (this.element.parentElement) {
            requestAnimationFrame(() => this.updatePeaks())
        }
    }

    terminate(): void {
        this.element.remove()
        this.terminator.terminate()
    }
}