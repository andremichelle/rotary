import {RotaryModel} from "../rotary/model"
import {RotaryUI} from "../rotary/ui"
import {RotaryRenderer} from "../rotary/render"
import {Mulberry32} from "../lib/math"
import {Chords} from "../lib/chords"
import {DSP, pulsarDelay} from "../lib/dsp"
import {readAudio} from "../lib/common"
import {exportVideo} from "../rotary/export"
import {ListItem, MenuBar} from "../dom/menu"

const canvas = document.querySelector("canvas")
const labelSize = document.querySelector("label.size")
const c2D = canvas.getContext("2d", {alpha: true})

// const model = new RotaryModel().test()
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

const context = new AudioContext()
if (context.state !== "running") {
    window.addEventListener("mousedown", () => context.resume(), {once: true})
} else {
    // context.suspend()
}

const compose = Chords.compose(Chords.Minor, 60, 0, 5)
const gains = []
const sum = context.createGain()
for (let i = 0; i < model.tracks.size(); i++) {
    const t = model.tracks.size() - i - 1
    const oscillator = context.createOscillator()
    const o = Math.floor(t / compose.length)
    const n = t % compose.length
    // if (0 === o) oscillator.type = "sawtooth"
    oscillator.frequency.value = DSP.midiToHz(compose[n] + o * 12)
    oscillator.start()

    const gainNode = context.createGain()
    gainNode.gain.value = 0.0
    oscillator.connect(gainNode)
    gainNode.connect(sum)
    gains[i] = gainNode
}

let frame: number = 0;


(async () => {
    const impulse = await readAudio(context, "../impulse/Deep Space.ogg")
    const convolverNode = context.createConvolver()
    convolverNode.buffer = impulse
    const wetGain = context.createGain()
    wetGain.gain.value = 0.5
    sum.connect(convolverNode).connect(wetGain).connect(context.destination)

    sum.connect(context.destination)
    pulsarDelay(context, sum, context.destination, 0.500, 0.750, 0.250, 0.5, 20000.0, 20.0)

    console.log("ready...")

    let prevTime = NaN
    const seconds = 8.0
    const enterFrame = (time) => {
        if (!isNaN(prevTime)) {
            // console.log(time - prevTime)
        }
        prevTime = time
        let progress = context.currentTime * 0.125 //time / (1000.0 * seconds)
        progress -= Math.floor(progress)
        const size = model.measureRadius() * 2
        const ratio = Math.ceil(devicePixelRatio)

        for (let i = 0; i < gains.length; i++) {
            const value = model.tracks.get(i).ratio(progress)
            gains[i].gain.linearRampToValueAtTime(0.0 < value ? 0.04 * value * value * value : 0.0, context.currentTime + 0.04)
        }

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

        frame++
        requestAnimationFrame(enterFrame)
    }
    requestAnimationFrame(enterFrame)
})()