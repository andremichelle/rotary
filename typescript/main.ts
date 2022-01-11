import {CollectionEvent, CollectionEventType, readAudio, Terminable} from "./lib/common.js"
import {Mulberry32} from "./lib/math.js"
import {pulsarDelay} from "./lib/dsp.js"
import {RotaryModel, RotaryTrackModel} from "./rotary/model.js"
import {RotaryApp} from "./rotary/app.js"
import {installApplicationMenu} from "./rotary/env.js"
import {RotaryWorkletNode} from "./rotary/audio.js"

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
    const model = new RotaryModel().test()//randomize(new Mulberry32(Math.floor(0x987123F * Math.random())))
    const app = RotaryApp.create(model)

    installApplicationMenu(document.querySelector("nav#app-menu"), model, app)

    const loopInSeconds = 8.0
    const context = new AudioContext()
    await context.suspend()
    const rotaryNode = await RotaryWorkletNode.build(context)
    rotaryNode.updateLoopDuration(loopInSeconds)
    const updateFormat = () => rotaryNode.updateFormat(model)
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
    convolverNode.buffer = await readAudio(context, "./impulse/LargeWideEchoHall.ogg")

    pulsarDelay(context, rotaryNode, convolverNode, 0.500, 0.250, 0.750, 0.2, 20000.0, 20.0)

    const wetGain = context.createGain()
    wetGain.gain.value = 0.1
    convolverNode.connect(wetGain).connect(context.destination)
    rotaryNode.connect(context.destination)

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