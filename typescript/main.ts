import {RotaryModel, RotaryTrackModel} from "./rotary/model.js"
import {RotaryUI} from "./rotary/ui.js"
import {Mulberry32} from "./lib/math.js"
import {pulsarDelay} from "./lib/dsp.js"
import {CollectionEvent, CollectionEventType, readAudio, Terminable} from "./lib/common.js"
import {exportVideo} from "./rotary/export.js"
import {ListItem, MenuBar} from "./dom/menu.js"

(async () => {
    const model = new RotaryModel().randomize(new Mulberry32(Math.floor(0x987123F * Math.random())))
    const ui = RotaryUI.create(model)
    const pickerOpts = {types: [{description: "rotary", accept: {"json/*": [".json"]}}]}
    const nav = document.querySelector("nav#app-menu")
    const zoomLevel: Map<string, number> = new Map([
        ["100%", 1.0], ["75%", 0.75], ["66%", 2.0 / 3.0], ["50%", 0.5], ["33%", 1.0 / 3.0], ["25%", 0.25]
    ])
    MenuBar.install()
        .offset(0, 0)
        .addButton(nav.querySelector("[data-menu='file']"), ListItem.root()
            .addListItem(ListItem.default("Open...", "", false)
                .onTrigger(async () => {
                    const fileHandles = await window.showOpenFilePicker(pickerOpts)
                    if (0 === fileHandles.length) {
                        return
                    }
                    const fileStream = await fileHandles[0].getFile()
                    const text: string = await fileStream.text()
                    const format = await JSON.parse(text)
                    model.deserialize(format)
                }))
            .addListItem(ListItem.default("Save...", "", false)
                .onTrigger(async () => {
                    const fileHandle = await window.showSaveFilePicker(pickerOpts)
                    const fileStream = await fileHandle.createWritable()
                    await fileStream.write(new Blob([JSON.stringify(model.serialize())], {type: "application/json"}))
                    await fileStream.close()
                }))
            .addListItem(ListItem.default("Export", "", false)
                .onTrigger(() => exportVideo()))
            .addListItem(ListItem.default("Clear", "", false)
                .onTrigger(() => model.clear()))
            .addListItem(ListItem.default("Randomize All", "", false)
                .onTrigger(() => model.randomize(new Mulberry32(Math.floor(0x987123F * Math.random())))))
            .addListItem(ListItem.default("Randomize Existing Tracks", "", false)
                .onTrigger(() => model.randomizeTracks(new Mulberry32(Math.floor(0x987123F * Math.random())))))
            .addListItem(ListItem.default("Randomize Track Colours", "", false)
                .onTrigger(() => model.tracks.forEach(track => track.randomizeRGB(new Mulberry32(Math.floor(0x987123F * Math.random()))))))
        )
        .addButton(nav.querySelector("[data-menu='edit']"), ListItem.root()
            .addListItem(ListItem.default("Create Track", "", false)
                .onTrigger(() => {
                    ui.createNew(null, false)
                }))
            .addListItem(ListItem.default("Copy Track", "", false)
                .onOpening(item => item.isSelectable(ui.hasSelected()))
                .onTrigger(() => {
                    ui.createNew(null, true)
                }))
            .addListItem(ListItem.default("Delete Track", "", false)
                .onOpening(item => item.isSelectable(ui.hasSelected()))
                .onTrigger(() => {
                    ui.deleteTrack()
                }))
        )
        .addButton(nav.querySelector("[data-menu='view']"), ListItem.root()
            .addListItem(ListItem.default("Zoom", "", false)
                .addRuntimeChildrenCallback(parent => {
                    for (const level of zoomLevel) {
                        parent.addListItem(ListItem.default(level[0], "", ui.zoom.get() === level[1])
                            .onTrigger(item => ui.zoom.set(level[1])))
                    }
                })))
        .addButton(nav.querySelector("[data-menu='help']"), ListItem.root()
            .addListItem(ListItem.default("Nothing yet", "", false)))

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