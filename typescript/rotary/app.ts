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
import {Checkbox, NumericStepperInput, SelectInput} from "../dom/inputs.js"
import {RotaryTrackEditor, RotaryTrackEditorExecutor} from "./editor.js"
import {Dom} from "../dom/common.js"
import {RotaryRenderer} from "./render.js"
import {Mulberry32, Random, TAU} from "../lib/math.js"
import {ListItem, MenuBar} from "../dom/menu.js"
import {open, renderGIF, renderVideo, renderWebM, save} from "./file.js"
import {Audio, AudioSceneController} from "./audio.js"

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
    private readonly liveContext: CanvasRenderingContext2D = this.elements.canvas.getContext("2d", {alpha: true})

    private readonly rawCanvas: HTMLCanvasElement = document.createElement("canvas")
    private readonly rawContext: CanvasRenderingContext2D = this.rawCanvas.getContext("2d", {alpha: true})

    readonly zoom = new ObservableValueImpl<number>(0.5)

    private constructor(private readonly model: RotaryModel,
                        private readonly elements: DomElements) {
        this.elements.template.remove()
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='start-radius']"),
            PrintMapping.integer("px"), new NumericStepper(1))).with(model.radiusMin)
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='phase-offset']"),
            PrintMapping.UnipolarPercent, new NumericStepper(0.01))).with(model.phaseOffset)
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='loop-duration']"),
            PrintMapping.integer("s"), new NumericStepper(1))).with(model.loopDuration)
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='live-sub-frames']"),
            PrintMapping.integer(""), new NumericStepper(1))).with(model.motion)
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='export-size']"),
            PrintMapping.integer("px"), new NumericStepper(1))).with(model.exportSettings.size)
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='export-fps']"),
            PrintMapping.integer(""), new NumericStepper(1))).with(model.exportSettings.fps)
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='export-sub-frames']"),
            PrintMapping.integer(""), new NumericStepper(1))).with(model.exportSettings.subFrames)

        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='pulsar-delay-delay-l']"),
            PrintMapping.float(3, "", "s"), new NumericStepper(0.001))).with(model.aux.sendPulsarDelay.preDelayTimeL)
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='pulsar-delay-delay-r']"),
            PrintMapping.float(3, "", "s"), new NumericStepper(0.001))).with(model.aux.sendPulsarDelay.preDelayTimeR)
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='pulsar-delay-feedback-delay']"),
            PrintMapping.float(3, "", "s"), new NumericStepper(0.001))).with(model.aux.sendPulsarDelay.feedbackDelayTime)
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='pulsar-delay-feedback-gain']"),
            PrintMapping.UnipolarPercent, new NumericStepper(0.01))).with(model.aux.sendPulsarDelay.feedbackGain)
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='pulsar-delay-feedback-lowpass']"),
            PrintMapping.integer("Hz"), new NumericStepper(1))).with(model.aux.sendPulsarDelay.feedbackLowpass)
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='pulsar-delay-feedback-highpass']"),
            PrintMapping.integer("Hz"), new NumericStepper(1))).with(model.aux.sendPulsarDelay.feedbackHighpass)
        this.terminator.with(new SelectInput<string>(document.querySelector("select[data-parameter='convolver-impulse']"),
            new Map<string, string>([
                ["Church", "impulse/Church.ogg"],
                ["Deep Space", "impulse/DeepSpace.ogg"],
                ["Hangar", "impulse/Hangar.ogg"],
                ["Large Echo Hall", "impulse/LargeWideEchoHall.ogg"],
                ["Plate Small", "impulse/PlateSmall.ogg"],
                ["Plate Medium", "impulse/PlateMedium.ogg"],
                ["Plate Large", "impulse/PlateLarge.ogg"],
                ["Prime Long", "impulse/PrimeLong.ogg"],
            ])).with(model.aux.sendConvolver))

        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='flanger-delay']"),
            PrintMapping.float(3, "", "s"), new NumericStepper(0.001))).with(model.aux.sendFlanger.delayTime)
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='flanger-feedback']"),
            PrintMapping.UnipolarPercent, new NumericStepper(0.01))).with(model.aux.sendFlanger.feedback)
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='flanger-rate']"),
            PrintMapping.float(2, "", "Hz"), new NumericStepper(0.01))).with(model.aux.sendFlanger.rate)
        this.terminator.with(new NumericStepperInput(document.querySelector("[data-parameter='flanger-depth']"),
            PrintMapping.UnipolarPercent, new NumericStepper(0.01))).with(model.aux.sendFlanger.depth)

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
        const offset = 1.0 / (this.model.loopDuration.get() * RotaryApp.FPS * subFrames)
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
                preview.transport.set(!preview.transport.get())
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
                    })))
            .addButton(element.querySelector("[data-menu='help']"), ListItem.root()
                .addListItem(ListItem.default("Open TODOs in Github (protected)", "", false)
                    .onTrigger(_ => window.open("https://github.com/andremichelle/rotary/wiki/TODOs"))))
        return this
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
    private readonly canvas: HTMLCanvasElement
    private readonly context: CanvasRenderingContext2D

    private readonly mute: Checkbox
    private readonly solo: Checkbox

    constructor(readonly ui: RotaryApp,
                readonly model: RotaryTrackModel,
                readonly element: HTMLElement,
                readonly radio: HTMLInputElement,
                readonly button: HTMLButtonElement) {
        this.terminator.with(Dom.bindEventListener(this.radio, "change",
            () => this.ui.select(this.model)))
        this.terminator.with(Dom.bindEventListener(this.button, "click",
            (event: MouseEvent) => {
                event.preventDefault()
                this.ui.createNew(this.model, event.shiftKey)
            }))
        this.canvas = this.element.querySelector("canvas")
        this.context = this.canvas.getContext("2d")
        this.mute = this.terminator.with(new Checkbox(element.querySelector("label.checkbox.mute input")))
        this.mute.with(this.model.mute)
        this.solo = this.terminator.with(new Checkbox(element.querySelector("label.checkbox.solo input")))
        this.solo.with(this.model.solo)
        this.terminator.with(this.model.addObserver(() => this.updatePreview()))
        requestAnimationFrame(() => this.updatePreview())
    }

    updatePreview(): void {
        const ratio = Math.ceil(devicePixelRatio)
        const w = this.canvas.width = this.canvas.clientWidth * ratio
        const h = this.canvas.height = this.canvas.clientHeight * ratio
        if (w === 0 || h === 0) return
        RotaryRenderer.renderTrackPreview(this.context, this.model, Math.max(w, h))
    }

    terminate(): void {
        this.element.remove()
        this.terminator.terminate()
    }
}