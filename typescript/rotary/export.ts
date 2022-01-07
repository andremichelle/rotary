export const exportVideo = async () => {
    const chunks: EncodedVideoChunk[] = []
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
}