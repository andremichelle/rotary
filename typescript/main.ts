import {RotaryModel, RotaryTrackModel} from "./rotary/model.js"
import {RotaryUI} from "./rotary/ui.js"
import {RotaryRenderer} from "./rotary/render.js"
import {Mulberry32} from "./lib/math.js"
import {pulsarDelay} from "./lib/dsp.js"
import {CollectionEvent, CollectionEventType, readAudio, Terminable} from "./lib/common.js"
import {exportVideo} from "./rotary/export.js"
import {ListItem, MenuBar} from "./dom/menu.js"

(async () => {
    const context = new AudioContext()
    if (context.state !== "running") {
        window.addEventListener("mousedown", () => context.resume(), {once: true})
    } else {
        // context.suspend()
    }

    const canvas = document.querySelector("canvas")
    const labelSize = document.querySelector("label.size")
    const c2D = canvas.getContext("2d", {alpha: true})

    const model = new RotaryModel().randomize(new Mulberry32(Math.floor(0x987123F * Math.random())))
    const renderer = new RotaryRenderer(c2D, model)
    const ui = RotaryUI.create(model, renderer)

    const pickerOpts = {types: [{description: "rotary", accept: {"json/*": [".json"]}}]}
    const nav = document.querySelector("nav#app-menu")
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
            .addListItem(ListItem.default("Randomize", "", false)
                .onTrigger(() => model.randomize(new Mulberry32(Math.floor(0x987123F * Math.random())))))
            .addListItem(ListItem.default("Randomize Track(s)", "", false)
                .onTrigger(() => model.randomizeTracks(new Mulberry32(Math.floor(0x987123F * Math.random())))))
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
            .addListItem(ListItem.default("Nothing yet", "", false)))
        .addButton(nav.querySelector("[data-menu='help']"), ListItem.root()
            .addListItem(ListItem.default("Nothing yet", "", false)))

    const progressIndicator = document.getElementById("progress")
    const radiant = parseInt(progressIndicator.getAttribute("r"), 10) * 2.0 * Math.PI
    progressIndicator.setAttribute("stroke-dasharray", radiant.toFixed(2))
    const setProgress = value => progressIndicator.setAttribute("stroke-dashoffset", ((1.0 - value) * radiant).toFixed(2))

    const loopInSeconds = 8.0

    context.audioWorklet.addModule("bin/worklets/rotary.js").then(() => {
        const rotary = new AudioWorkletNode(context, "rotary", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [1],
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        })
        const updateAll = () => {
            rotary.port.postMessage({
                action: "format",
                value: model.serialize()
            })
        }
        rotary.port.postMessage({
            action: "loopInSeconds",
            value: loopInSeconds
        })
        const observer = () => updateAll()
        const observers: Map<RotaryTrackModel, Terminable> = new Map()
        model.tracks.forEach((track, index) => observers.set(track, track.addObserver(observer)))
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
        readAudio(context, "../impulse/Large Wide Echo Hall.ogg").then(buffer => convolverNode.buffer = buffer)

        pulsarDelay(context, rotary, convolverNode, 0.500, 0.750, 0.250, 0.2, 20000.0, 20.0)

        const wetGain = context.createGain()
        wetGain.gain.value = 0.5
        convolverNode.connect(wetGain).connect(context.destination)
        rotary.connect(context.destination)
    })

    console.log("ready...")

    let prevTime = NaN

    const enterFrame = (time) => {
        if (!isNaN(prevTime)) {
            // console.log(time - prevTime)
        }
        prevTime = time
        let progress = context.currentTime / loopInSeconds
        progress -= Math.floor(progress)
        const size = model.measureRadius() * 2
        const ratio = Math.ceil(devicePixelRatio)

        canvas.width = size * ratio
        canvas.height = size * ratio
        canvas.style.width = `${size}px`
        canvas.style.height = `${size}px`
        labelSize.textContent = `${size}`

        c2D.clearRect(0.0, 0.0, size, size)
        c2D.save()
        c2D.scale(ratio, ratio)
        c2D.translate(size >> 1, size >> 1)
        renderer.draw(progress)
        c2D.restore()

        setProgress(progress)
        requestAnimationFrame(enterFrame)
    }
    requestAnimationFrame(enterFrame)
})()