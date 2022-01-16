import {CollectionEvent, CollectionEventType, readAudio, Terminable} from "./lib/common.js"
import {Mulberry32, Random} from "./lib/math.js"
import {RotaryModel, RotaryTrackModel} from "./rotary/model.js"
import {RotaryApp} from "./rotary/app.js"
import {installApplicationMenu} from "./rotary/env.js"
import {MappingNode, RotaryAutomationNode} from "./rotary/audio.js"
import {Generator} from "./padsynth/generator.js"
import {Harmonic} from "./padsynth/data.js"
import {DSP, pulsarDelay} from "./lib/dsp.js"
import {Exp} from "./lib/mapping.js"

const showError = (message: string) => {
    const preloader = document.getElementById("preloader")
    if (null === preloader) {
        alert(message)
    } else {
        preloader.innerHTML = `<span style="color: #F33">${message}</span>`
    }
}
window.onerror = (message: string) => {
    showError(message)
    return true
}
window.onunhandledrejection = (event) => {
    if (event.reason instanceof Error) {
        showError(event.reason.message)
    } else {
        showError(event.reason)
    }
}
(async () => {
    const random: Random = new Mulberry32(0xFFFFFFFF * Math.random())
    const model = new RotaryModel().randomize(random)
    const app = RotaryApp.create(model)

    installApplicationMenu(document.querySelector("nav#app-menu"), model, app)

    const loopInSeconds = 8.0
    const context = new AudioContext()
    await context.suspend()
    const rotaryAutomationNode = await RotaryAutomationNode.build(context)
    rotaryAutomationNode.updateLoopDuration(loopInSeconds)

    const updateFormat = () => rotaryAutomationNode.updateFormat(model)
    const observers: Map<RotaryTrackModel, Terminable> = new Map()
    model.tracks.forEach((track: RotaryTrackModel) => observers.set(track, track.addObserver(updateFormat)))
    model.tracks.addObserver((event: CollectionEvent<RotaryTrackModel>) => {
        if (event.type === CollectionEventType.Add) {
            observers.set(event.item, event.item.addObserver(updateFormat))
        } else if (event.type === CollectionEventType.Remove) {
            const observer = observers.get(event.item)
            console.assert(observer !== undefined)
            observers.delete(event.item)
            observer.terminate()
        } else if (event.type === CollectionEventType.Order) {
            // ... nothing
        }
        updateFormat()
    })
    updateFormat()

    const convolverNode = context.createConvolver()
    convolverNode.normalize = false
    convolverNode.buffer = await readAudio(context, "./impulse/PlateMedium.ogg")

    const tracksGain = context.createGain()
    tracksGain.gain.value = 0.07

    await MappingNode.load(context)

    const channelSplitter = context.createChannelSplitter(RotaryModel.MAX_TRACKS)
    rotaryAutomationNode.connect(channelSplitter)

    const notes = new Uint8Array([60, 62, 65, 67, 69, 72, 74, 77, 79, 81])

    const generator = new Generator(1 << 17)
    for (let i = 0; i < RotaryModel.MAX_TRACKS; i++) {
        const gainNode = context.createGain()
        gainNode.gain.value = 0.0
        channelSplitter.connect(gainNode.gain, i)

        const pannerNode = context.createStereoPanner()
        pannerNode.pan.value = random.nextDouble(-1.0, 1.0)

        const note = random.nextElement(notes)
        const hz = DSP.midiToHz(note)
        const bandWidth = new Exp(0.0001, 0.25).y(random.nextDouble(0.0, 1.0))
        const harmonics = [
            new Harmonic(hz / context.sampleRate, 1.0, bandWidth),
            new Harmonic(hz / context.sampleRate * 2.0, 0.2500, bandWidth * 2.0),
            new Harmonic(hz / context.sampleRate * 2.0, 0.0625, bandWidth * 3.0),
        ]
        const wavetable = await generator.render(harmonics)
        const buffer = context.createBuffer(1, wavetable.length, context.sampleRate)
        buffer.copyToChannel(wavetable, 0)
        const bufferSource = context.createBufferSource()
        bufferSource.buffer = buffer
        bufferSource.playbackRate.value = random.nextDouble(-0.999, 1.001)
        bufferSource.loop = true
        bufferSource.start()

        bufferSource.connect(gainNode).connect(pannerNode).connect(tracksGain)
    }

    tracksGain.connect(context.destination)
    const wetGain = context.createGain()
    wetGain.gain.value = 0.9
    pulsarDelay(context, tracksGain, wetGain, 0.500, 0.125, 0.750, 0.99, 720.0, 480.0)

    wetGain.connect(convolverNode).connect(context.destination)

    const playButton = document.querySelector("[data-parameter='transport']") as HTMLInputElement
    playButton.onchange = async () => {
        if (playButton.checked) await context.resume()
        else await context.suspend()
    }

    document.getElementById("preloader").remove()
    console.log("ready...")

    const enterFrame = () => {
        const progress = context.currentTime / loopInSeconds
        app.render(progress - Math.floor(progress))
        requestAnimationFrame(enterFrame)
    }
    requestAnimationFrame(enterFrame)
})()