import {RotaryModel} from "./rotary/model"
import {RotaryUI} from "./rotary/ui"
import {RotaryRenderer} from "./rotary/render"
import {Mulberry32} from "./lib/math"
import MenuBar = menu.MenuBar
import ListItem = menu.ListItem

const canvas = document.querySelector("canvas")
const labelSize = document.querySelector("label.size")
const context = canvas.getContext("2d", {alpha: true})

const model = new RotaryModel().randomize(new Mulberry32(Math.floor(0x987123F * Math.random())))
const renderer = new RotaryRenderer(context, model)
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
        .addListItem(ListItem.default("Clear", "", false)
            .onTrigger(() => {
                model.clear()
            }))
    )
    .addButton(nav.querySelector("[data-menu='edit']"), ListItem.root()
        .addListItem(ListItem.default("Create Track", "", false)
            .onTrigger(item => {
                ui.createNew(null, false)
            }))
        .addListItem(ListItem.default("Copy Track", "", false)
            .onOpening(item => item.isSelectable(ui.hasSelected()))
            .onTrigger(item => {
                ui.createNew(null, true)
            }))
        .addListItem(ListItem.default("Delete Track", "", false)
            .onOpening(item => item.isSelectable(ui.hasSelected()))
            .onTrigger(item => {
                ui.delete()
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

let frame: number = 0;

(() => {
    console.log("ready...")

    let prevTime = NaN
    const seconds = 8.0
    const enterFrame = (time) => {
        if (!isNaN(prevTime)) {
            // console.log(time - prevTime)
        }
        prevTime = time
        const position = time / (1000.0 * seconds)
        const progress = position - Math.floor(position)
        const size = model.measureRadius() * 2
        const ratio = Math.ceil(devicePixelRatio)

        canvas.width = size * ratio
        canvas.height = size * ratio
        canvas.style.width = `${size}px`
        canvas.style.height = `${size}px`
        labelSize.textContent = `${size}`

        context.clearRect(0.0, 0.0, size, size)
        context.save()
        context.scale(ratio, ratio)
        context.translate(size >> 1, size >> 1)
        renderer.draw(progress)
        context.restore()

        setProgress(progress)

        frame++
        requestAnimationFrame(enterFrame)
    }
    requestAnimationFrame(enterFrame)
})()