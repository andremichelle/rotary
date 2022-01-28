import {RotaryModel} from "./model.js"
import {RotaryRenderer} from "./render.js"
import {ProgressIndicator} from "../dom/common.js"
import {encodeWavFloat} from "../dsp/common.js"
import {Audio} from "./audio.js"

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
    const size = model.exportSettings.size.get()
    const fps = model.exportSettings.fps.get()
    const numFrames = Math.floor(fps * model.loopDuration.get())
    console.log(`numFrames: ${numFrames}`)
    const writer = new WebMWriter({
        quality: 0.99,
        transparent: true,
        frameRate: fps,
        alphaQuality: 1.0
    })
    const progressIndicator = new ProgressIndicator("Export WebM")
    await progressIndicator.completeWith(RotaryRenderer.renderFrames(model,
        model.exportSettings.getConfiguration(numFrames),
        context => writer.addFrame(context.canvas), progressIndicator.onProgress))
    const blob = await writer.complete()
    window.open(URL.createObjectURL(blob))
}

export const renderGIF = async (model: RotaryModel) => {
    const fps = model.exportSettings.fps.get()
    const size = model.exportSettings.size.get()
    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: size,
        height: size,
        workerScript: "lib/gif.worker.js"
    })
    const option = {
        copy: true,
        delay: 1000 / fps
    }
    const numFrames = Math.floor(fps * model.loopDuration.get())
    const progressIndicator = new ProgressIndicator("Export GIF")
    await RotaryRenderer.renderFrames(model,
        model.exportSettings.getConfiguration(numFrames),
        context => gif.addFrame(context.canvas, option),
        progress => progressIndicator.onProgress(progress * 0.5))
    gif.once("finished", (blob) => {
        progressIndicator.complete()
        window.open(URL.createObjectURL(blob))
    })
    gif.addListener("progress", progress => progressIndicator.onProgress(0.5 + progress * 0.5))
    gif.render()
}

export const renderWav = async (audio: Audio) => {
    const source: AudioBuffer = await audio.render()
    const totalFrames = audio.totalFrames
    const target: Float32Array[] = []
    for (let i = 0; i < source.numberOfChannels; i++) {
        target[i] = new Float32Array(totalFrames)
        source.copyFromChannel(target[i], i, source.length - totalFrames)
    }
    const wav: ArrayBuffer = encodeWavFloat({
        channels: target,
        numFrames: totalFrames,
        sampleRate: source.sampleRate
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

export const renderVideo = async (model: RotaryModel) => {
    let totalBytes = 0 | 0

    const buffers: Uint8Array[] = []
    const encoder = new VideoEncoder({
        output: (chunk: EncodedVideoChunk, metadata: EncodedVideoChunkMetadata) => {
            totalBytes += chunk.byteLength
            const arrayBuffer = new Uint8Array(new ArrayBuffer(chunk.byteLength))
            chunk.copyTo(arrayBuffer)
            buffers.push(arrayBuffer)
        },
        error: error => {
            console.log(`error: ${error}`)
        }
    })
    const size = model.exportSettings.size.get()
    const numFrames = Math.floor(60 * /*model.loopDuration.get()*/1)
    const progressIndicator = new ProgressIndicator("Export GIF")
    const renderConfiguration = model.exportSettings.getConfiguration(numFrames)
    encoder.configure({
        codec: "vp8",
        width: size,
        height: size,
        alpha: "discard",
        latencyMode: "quality",
        framerate: renderConfiguration.fps
    })
    await RotaryRenderer.renderFrames(model, renderConfiguration,
        context => {
            const frame = new VideoFrame(context.canvas)
            encoder.encode(frame)
            frame.close()
        },
        progress => progressIndicator.onProgress(progress * 0.5))
    await progressIndicator.completeWith(encoder.flush())

    // TODO Create header for chunk and decoding metadata
    const video = new Uint8Array(new ArrayBuffer(totalBytes))
    let write = 0 | 0
    for (let i = 0; i < buffers.length; i++) {
        const buffer: Uint8Array = buffers[i]
        for (let j = 0; j < buffer.byteLength; j++) {
            video[write++] = buffer[j]
        }
    }
}