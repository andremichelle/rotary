import {CollectionEvent, CollectionEventType, readAudio, Terminable} from "./lib/common.js"
import {Mulberry32} from "./lib/math.js"
import {pulsarDelay} from "./lib/dsp.js"
import {RotaryModel, RotaryTrackModel} from "./rotary/model.js"
import {RotaryUI} from "./rotary/ui.js"
import {installApplicationMenu} from "./rotary/env.js"

(async () => {
    const model = new RotaryModel().randomize(new Mulberry32(Math.floor(0x987123F * Math.random())))
    const ui = RotaryUI.create(model)
    const nav: HTMLElement = document.querySelector("nav#app-menu")

    installApplicationMenu(nav, model, ui)

    const loopInSeconds = 8.0

    const context = new AudioContext()
    await context.suspend()
    await context.audioWorklet.addModule("bin/worklets/rotary.js")

    const rotaryNode = new AudioWorkletNode(context, "rotary", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
        channelCount: 1,
        channelCountMode: "explicit",
        channelInterpretation: "speakers"
    })
    const updateAll = () => {
        rotaryNode.port.postMessage({
            action: "format",
            value: model.serialize()
        })
    }
    rotaryNode.port.postMessage({
        action: "loopInSeconds",
        value: loopInSeconds
    })
    const observer = () => updateAll()
    const observers: Map<RotaryTrackModel, Terminable> = new Map()
    model.tracks.forEach((track: RotaryTrackModel) => observers.set(track, track.addObserver(observer)))
    model.tracks.addObserver((event: CollectionEvent<RotaryTrackModel>) => {
        if (event.type === CollectionEventType.Add) {
            observers.set(event.item, event.item.addObserver(observer))
        } else if (event.type === CollectionEventType.Remove) {
            const observer = observers.get(event.item)
            console.assert(observer !== undefined)
            observers.delete(event.item)
            observer.terminate()
        } else if (event.type === CollectionEventType.Order) {
        }
        updateAll()
    })
    updateAll()

    const convolverNode = context.createConvolver()
    convolverNode.normalize = false
    readAudio(context, "./impulse/LargeWideEchoHall.ogg").then(buffer => convolverNode.buffer = buffer)

    pulsarDelay(context, rotaryNode, convolverNode, 0.500, 0.750, 0.250, 0.2, 20000.0, 20.0)

    const wetGain = context.createGain()
    wetGain.gain.value = 0.5
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
        ui.render(progress - Math.floor(progress))
        requestAnimationFrame(enterFrame)
    }
    requestAnimationFrame(enterFrame)
})()