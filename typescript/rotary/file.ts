import {RotaryModel} from "./model.js"
import {RotaryRenderer} from "./render.js"

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

export const render = async (model: RotaryModel) => {
    const canvas = document.createElement("canvas")
    const size = 256
    const numFrames = 60 * 8
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext("2d")
    const gif = new GIF({
        workers: 4,
        quality: 10,
        width: size,
        height: size,
        workerScript: "lib/gif.worker.js"
    })
    const scale: number = size / model.measureRadius() * 0.5
    const renderer = new RotaryRenderer(context, model)
    for (let i = 0; i < numFrames; i++) {
        context.clearRect(0, 0, size, size)
        context.save()
        context.translate(size >> 1, size >> 1)
        context.scale(scale, scale)
        renderer.draw(i / numFrames)
        context.restore()
        gif.addFrame(canvas, {copy: true, delay: 1000 / 60})
    }
    gif.addListener("progress", progress => console.log(progress))
    gif.once("finished", (blob) => {
        console.log("done", blob)
        window.open(URL.createObjectURL(blob))
    })
    console.log(gif.render())

    /*const chunks: EncodedVideoChunk[] = []
    let bytesTotal: number = 0|0
    const encoder = new VideoEncoder({
        output: ((chunk: EncodedVideoChunk, metadata: EncodedVideoChunkMetadata | undefined) => {
            console.log(chunk, metadata)
            chunks.push(chunk)
            bytesTotal += chunk.byteLength
        }),
        error: (error) => {
            console.warn(error)
        }
    })

    // TODO https://w3c.github.io/webcodecs/samples/capture-to-file/webm-writer2.js
    // view-source:https://w3c.github.io/webcodecs/samples/capture-to-file/capture-to-file.html


    // https://www.w3.org/TR/webcodecs-codec-registry/
    encoder.configure({
        width: 512,
        height: 512,
        codec: "vp8"
    })
    console.log(`encoder.state = ${encoder.state}`)
    console.log("create canvas")
    const canvas = document.querySelector("canvas")
    canvas.width = 512
    canvas.height = 512
    const context = canvas.getContext("2d", {alpha: true})

    context.fillStyle = "red"
    context.fillRect(64, 64, 64, 64)
    console.log(`flush encodeQueueSize: ${encoder.encodeQueueSize}`)
    encoder.encode(new VideoFrame(canvas))

    context.fillStyle = "green"
    context.fillRect(96, 96, 64, 64)
    console.log(`flush encodeQueueSize: ${encoder.encodeQueueSize}`)
    encoder.encode(new VideoFrame(canvas))


    await encoder.flush()
    console.log(`flushed encodeQueueSize: ${encoder.encodeQueueSize}`)
    console.log("close")
    encoder.close()

    const bytes: Uint8Array = new Uint8Array(bytesTotal)
    const view: DataView = new DataView(bytes.buffer)
    for (const chunk of chunks) {
        chunk.copyTo(view)
    }
    console.log(bytes)
    alert("Not yet implemented")*/
}