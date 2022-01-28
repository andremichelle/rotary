import {RotaryModel} from "./model.js"
import {MeterWorklet} from "../dsp/meter/worklet.js"
import {Dom, ProgressIndicator} from "../dom/common.js"
import {ObservableValue, Terminable} from "../lib/common"

export interface AudioSceneController extends Terminable {
    transport: ObservableValue<boolean>

    phase(): number

    rewind(): void
}

export interface AudioScene {
    build(context: BaseAudioContext, output: AudioNode, model: RotaryModel, onProgressInfo: (info: string) => void): Promise<AudioSceneController>
}

export class Audio {
    static async config(scene: AudioScene, model: RotaryModel): Promise<[Audio, AudioSceneController]> {
        const context = new AudioContext()
        await context.suspend()
        await MeterWorklet.load(context)
        const meter = new MeterWorklet(context)
        Dom.replaceElement(meter.domElement, document.getElementById("meter"))
        meter.connect(context.destination)
        const preview: AudioSceneController = await scene.build(context, meter, model, info => {
            const element = document.getElementById("preloader-message")
            if (null !== element) {
                element.textContent = info
            }
        })
        const playButton = document.querySelector("[data-parameter='transport']") as HTMLInputElement
        preview.transport.addObserver(moving => playButton.checked = moving)
        playButton.onchange = async () => {
            if (playButton.checked) {
                if (context.state !== "running") {
                    await context.resume()
                }
                preview.transport.set(true)
            } else {
                preview.transport.set(false)
            }
        }
        (document.querySelector("button.rewind") as HTMLButtonElement).onclick = () => preview.rewind()
        return [new Audio(context, scene, model), preview]
    }

    static RENDER_SAMPLE_RATE = 48000 | 0

    private constructor(readonly context: AudioContext,
                        readonly scene: AudioScene,
                        readonly model: RotaryModel) {
    }

    get currentTime(): number {
        return this.context.currentTime
    }

    get totalTime(): number {
        return this.model.loopDuration.get()
    }

    get totalFrames(): number {
        return Math.floor(this.model.loopDuration.get() * Audio.RENDER_SAMPLE_RATE) | 0
    }

    async render(passes: number = 2 | 0): Promise<AudioBuffer> {
        await this.context.suspend()
        const duration = this.model.loopDuration.get() * passes
        const offlineAudioContext = new OfflineAudioContext(2,
            Math.floor(Audio.RENDER_SAMPLE_RATE * duration) | 0, Audio.RENDER_SAMPLE_RATE)
        const loadingIndicator = new ProgressIndicator("Export Audio...")
        const terminable = await loadingIndicator.completeWith(
            this.scene.build(offlineAudioContext, offlineAudioContext.destination, this.model, info => {
                console.debug(info)
            }))
        const exportIndicator = new ProgressIndicator("Exporting Audio")
        const watch = () => {
            exportIndicator.onProgress(offlineAudioContext.currentTime / duration)
            if (offlineAudioContext.state === "running") {
                requestAnimationFrame(watch)
            }
        }
        requestAnimationFrame(watch)
        const buffer = await exportIndicator.completeWith(offlineAudioContext.startRendering())
        terminable.terminate()
        return buffer
    }
}