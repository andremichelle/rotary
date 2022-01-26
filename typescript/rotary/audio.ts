import {RotaryModel} from "./model.js"
import {MeterWorklet} from "../dsp/meter/worklet.js"
import {Dom, ProgressIndicator} from "../dom/common.js"
import {Terminable} from "../lib/common"

export interface AudioBuilder {
    build(context: BaseAudioContext, output: AudioNode, model: RotaryModel, onProgressInfo: (info: string) => void): Promise<Terminable>
}

export class Audio {
    static async create(builder: AudioBuilder, model: RotaryModel): Promise<Audio> {
        const context = new AudioContext()
        await context.suspend()
        await MeterWorklet.load(context)
        const meter = new MeterWorklet(context)
        Dom.replaceElement(meter.domElement, document.getElementById("meter"))
        meter.connect(context.destination)
        const playButton = document.querySelector("[data-parameter='transport']") as HTMLInputElement
        context.onstatechange = () => playButton.checked = context.state === "running"
        playButton.onchange = async () => {
            if (playButton.checked) await context.resume()
            else await context.suspend()
        }
        await builder.build(context, meter, model, info => {
            const element = document.getElementById("preloader-message")
            if (null !== element) {
                element.textContent = info
            }
        })
        return new Audio(context, builder, model)
    }

    static SAMPLE_RATE = 48000 | 0

    private constructor(readonly context: AudioContext,
                        readonly builder: AudioBuilder,
                        readonly model: RotaryModel) {
    }

    get currentTime(): number {
        return this.context.currentTime
    }

    get totalTime(): number {
        return this.model.loopDuration.get()
    }

    get totalFrames(): number {
        return Math.floor(this.model.loopDuration.get() * Audio.SAMPLE_RATE)
    }

    async render(passes: number = 2 | 0): Promise<AudioBuffer> {
        await this.context.suspend()
        const duration = this.model.loopDuration.get() * passes
        const offlineAudioContext = new OfflineAudioContext(2, Math.floor(Audio.SAMPLE_RATE * duration) | 0, Audio.SAMPLE_RATE)
        const loadingIndicator = new ProgressIndicator("Export Audio...")
        const terminable = await loadingIndicator.completeWith(
            this.builder.build(offlineAudioContext, offlineAudioContext.destination, this.model, info => {
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