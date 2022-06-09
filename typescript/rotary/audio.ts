// noinspection JSUnusedGlobalSymbols

import {RotaryModel} from "./model/rotary.js"
import {NoUIMeterWorklet, StereoMeterWorklet} from "../audio/meter/worklet.js"
import {ProgressIndicator} from "../dom/common.js"
import {Boot, Terminable} from "../lib/common.js"
import {encodeWavFloat} from "../audio/common.js"
import {Transport} from "../audio/sequencing.js"
import {Metronome} from "../audio/metronome/worklet.js"

export interface AudioSceneController extends Terminable {
    position(): number

    latency(): number

    metronome: Metronome

    transport: Transport

    meter: NoUIMeterWorklet
}

export interface AudioScene {
    loadModules(context: BaseAudioContext): Promise<void>

    build(context: BaseAudioContext,
          output: AudioNode,
          model: RotaryModel,
          boot: Boot): Promise<AudioSceneController>
}

export class Audio {
    static async config(scene: AudioScene, model: RotaryModel): Promise<Audio> {
        const context = new AudioContext()
        if (context.state !== "suspended") { // fix for SAFARI (stopped silently forever)
            await context.suspend()
        }
        return new Audio(context, scene, model)
    }

    static RENDER_SAMPLE_RATE = 48000 | 0

    private constructor(readonly context: AudioContext,
                        readonly scene: AudioScene,
                        readonly model: RotaryModel) {
    }

    async initPreview(): Promise<AudioSceneController> {
        await this.scene.loadModules(this.context)
        const masterMeter = new StereoMeterWorklet(this.context)
        document.getElementById("meter").appendChild(masterMeter.domElement)
        masterMeter.connect(this.context.destination)
        const boot: Boot = new Boot()
        boot.addObserver(boot => {
            const element = document.getElementById("preloader-message")
            if (null !== element) {
                element.textContent = `${boot.percentage()}% loaded`
            }
        })
        const preview: AudioSceneController = await this.scene.build(this.context, masterMeter, this.model, boot)
        const playButton = document.querySelector("[data-parameter='transport']") as HTMLInputElement
        preview.transport.addObserver(async message => {
            switch (message.type) {
                case "transport-play": {
                    if (this.context.state !== "running") {
                        await this.context.resume()
                    }
                    playButton.checked = true
                    break
                }
                case "transport-pause": {
                    playButton.checked = false
                    break
                }
            }
        }, false)
        playButton.onchange = async () => {
            if (playButton.checked) {
                preview.transport.play()
            } else {
                preview.transport.pause()
            }
        }
        (document.querySelector("button.rewind") as HTMLButtonElement).onclick = () => preview.transport.stop()
        return preview
    }

    get currentTime(): number {
        return this.context.currentTime
    }

    get totalTime(): number {
        return this.model.duration()
    }

    get totalFrames(): number {
        return Math.floor(this.model.duration() * Audio.RENDER_SAMPLE_RATE) | 0
    }

    async exportWav(passes: number = 2 | 0): Promise<void> {
        const channels: Float32Array[] = await this.render(passes)
        const wav: ArrayBuffer = encodeWavFloat({
            channels: channels,
            numFrames: Math.min(channels[0].length, channels[1].length),
            sampleRate: Audio.RENDER_SAMPLE_RATE
        })
        try {
            const saveFilePicker = await window.showSaveFilePicker({suggestedName: "loop.wav"})
            const writableFileStream = await saveFilePicker.createWritable()
            writableFileStream.write(wav)
            writableFileStream.close()
        } catch (e) {
            console.log(`abort with ${e}`)
        }
    }

    async render(passes: number): Promise<Float32Array[]> {
        await this.context.suspend()
        const duration = this.model.duration() * passes
        console.log(`duration: ${duration}s`)
        const length = Math.floor(Audio.RENDER_SAMPLE_RATE * duration) | 0
        const offlineAudioContext = new OfflineAudioContext(2,
            length + Audio.RENDER_SAMPLE_RATE /* A SECOND EXTRA FOR LATENCY COMPENSATION */, Audio.RENDER_SAMPLE_RATE)
        const loadingIndicator = new ProgressIndicator("Preparing Export...")
        await this.scene.loadModules(offlineAudioContext)
        const boot: Boot = new Boot()
        boot.addObserver(boot => loadingIndicator.onProgress(boot.normalizedPercentage()))
        const controller: AudioSceneController = await loadingIndicator.completeWith(
            this.scene.build(offlineAudioContext, offlineAudioContext.destination, this.model, boot))
        controller.transport.play()
        const exportIndicator = new ProgressIndicator("Exporting Audio...")
        const watch = () => {
            exportIndicator.onProgress(offlineAudioContext.currentTime / duration)
            if (offlineAudioContext.state === "running") {
                requestAnimationFrame(watch)
            }
        }
        requestAnimationFrame(watch)
        const buffer = await exportIndicator.completeWith(offlineAudioContext.startRendering())
        const latencyFrames = Math.ceil(controller.latency() * Audio.RENDER_SAMPLE_RATE) | 0
        controller.terminate()
        const totalFrames = this.totalFrames
        const target: Float32Array[] = []
        const bufferOffset = buffer.length - buffer.sampleRate - totalFrames + latencyFrames
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            target[i] = new Float32Array(totalFrames)
            buffer.copyFromChannel(target[i], i, bufferOffset)
        }
        return target
    }
}