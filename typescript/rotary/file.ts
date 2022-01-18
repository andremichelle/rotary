import {RotaryModel} from "./model.js"
import {RotaryRenderer} from "./render.js"
import {ProgressIndicator} from "../dom/common.js"

const pickerOpts = {types: [{description: "rotary", accept: {"json/*": [".json"]}}]}

export const open = async (model: RotaryModel) => {
    const fileHandles = await window.showOpenFilePicker(pickerOpts)
    if (0 === fileHandles.length) {
        return
    }
    const fileStream = await fileHandles[0].getFile()
    const text: string = await fileStream.text()
    const format = await JSON.parse(text)
    model.deserialize(format)
}

export const save = async (model: RotaryModel) => {
    const fileHandle = await window.showSaveFilePicker(pickerOpts)
    const fileStream = await fileHandle.createWritable()
    await fileStream.write(new Blob([JSON.stringify(model.serialize())], {type: "application/json"}))
    await fileStream.close()
}

export const renderWebM = async (model: RotaryModel) => {
    const size = model.exportSize.get()
    const numFrames = Math.floor(60 * model.loopDuration.get())
    const writer = new WebMWriter({
        // quality: 0.99999,
        quality: 0.9,
        transparent: true,
        frameRate: 60.0,
        frameDuration: 1000.0 / 60.0,
        alphaQuality: 1.0
    })
    const progressIndicator = new ProgressIndicator()
    await progressIndicator.completeWith(RotaryRenderer.renderFrames(model, numFrames, size,
        context => writer.addFrame(context.canvas), progressIndicator.onProgress))
    const blob = await writer.complete()
    window.open(URL.createObjectURL(blob))
}

export const renderGIF = async (model: RotaryModel) => {
    const size = model.exportSize.get()
    const gif = new GIF({
        workers: 8,
        quality: 10,
        width: size,
        height: size,
        workerScript: "lib/gif.worker.js"
    })
    const option = {
        copy: true,
        delay: 1000 / 60
    }
    const numFrames = Math.floor(60 * model.loopDuration.get())
    const progressIndicator = new ProgressIndicator()
    await RotaryRenderer.renderFrames(model, numFrames, size,
        context => gif.addFrame(context.canvas, option),
        progress => progressIndicator.onProgress(progress * 0.5))
    gif.once("finished", (blob) => {
        progressIndicator.complete()
        window.open(URL.createObjectURL(blob))
    })
    gif.addListener("progress", progress => progressIndicator.onProgress(0.5 + progress * 0.5))
    gif.render()
}