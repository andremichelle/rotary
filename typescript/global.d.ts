interface AudioWorkletProcessor {
    port: MessagePort
}

interface AudioParamDescriptor {
    defaultValue?: number
    maxValue?: number
    minValue?: number
    name: string
}

declare var AudioWorkletProcessor: {
    prototype: AudioWorkletProcessor
    port: MessagePort
    new(option?: any): AudioWorkletProcessor
    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: { [name: string]: Float32Array }): boolean
}

type GIFDither = "FloydSteinberg" | "FalseFloydSteinberg" | "Stucki" | "Atkinson"

interface GIFInitOptions {
    workers?: number
    quality?: number
    repeat?: number // repeat count, -1 = no repeat, 0 = forever
    workerScript?: string
    background?: string
    width: number
    height: number
    transparent?: boolean
    dither?: GIFDither | false
    debug?: boolean
}

interface GIFFrameOptions {
    delay?: number
    copy?: boolean
    dispose?: number // frame disposal code. See https://www.w3.org/Graphics/GIF/spec-gif89a.txt
}

interface GIF {
    addFrame(source: CanvasImageSource, option?: GIFFrameOptions): void

    addListener(type: "progress", onProgress: (progress: number) => void): void

    once(type: "finished", callback: (blob: Blob) => void): void

    render(): boolean

    abort(): void
}

declare var GIF: {
    readonly running: boolean
    new(option: GIFInitOptions): GIF
}

declare var sampleRate: number
declare var currentTime: number

declare function registerProcessor<T extends AudioWorkletProcessor>(name: string, processorCtor: T): void

// noinspection JSUnusedGlobalSymbols

declare interface CanvasFillStrokeStyles {
    createConicGradient(angle: number, arg1: number, arg2: number): CanvasGradient;
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream/
declare interface FileSystemWritableFileStream {
    write(data: BufferSource | Blob): void

    close(): void
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle
declare interface FileSystemFileHandle {
    createWritable(): Promise<FileSystemWritableFileStream>

    getFile(): Promise<File>
}

declare interface PickerOptionType {
    description: string
    accept?: { [key: string]: string[] }
}

declare interface PickerOptions {
    excludeAcceptAllOption?: boolean
    suggestedName?: string
    multiple?: boolean
    types?: PickerOptionType[]
}

// Hides error TS2339: Property 'text' does not exist on type 'File'
declare interface Window {
    showOpenFilePicker(pickerOpts?: PickerOptions): Promise<FileSystemFileHandle[]>

    showSaveFilePicker(pickerOpts?: PickerOptions): Promise<FileSystemFileHandle>
}

declare interface File extends Blob {
    text(): Promise<string>
}

declare interface VideoEncoderConfig {
    codec: string
    width: number
    height: number
    displayWidth?: number
    displayHeight?: number
    bitrate?: number
    framerate?: number
    scalabilityMode?: string
    alpha?: "keep" | "discard"
    bitrateMode?: "constant" | "variable"
    latencyMode?: "quality" | "realtime"
    hardwareAcceleration?: "no-preference" | "prefer-hardware" | "prefer-software"
}

declare interface EncodedVideoChunk {
    readonly type: "key" | "delta"
    readonly timestamp: number // microseconds
    readonly duration?: number // microseconds
    readonly byteLength: number

    copyTo(destination: BufferSource): void
}

declare interface ColorSpace {
    fullRange: boolean
    matrix: string
    primaries: string
    transfer: string
}

declare interface DecoderConfig {
    codec: string
    codedWidth: number
    codedHeight: number
    colorSpace: ColorSpace
    hardwareAcceleration: 'no-preference'
}

declare interface EncodedVideoChunkMetadata {
    decoderConfig?: DecoderConfig
}

declare type EncodedVideoChunkOutputCallback = (chunk: EncodedVideoChunk, metadata?: EncodedVideoChunkMetadata) => void
declare type WebCodecsErrorCallback = (error: Error) => void

declare interface VideoEncoderInit {
    output: EncodedVideoChunkOutputCallback
    error: WebCodecsErrorCallback
}

declare interface VideoFrameInit {
}

declare interface VideoFrameBufferInit {
}

declare interface VideoPixelFormat {
}

declare interface VideoColorSpace {
}

declare interface VideoFrameCopyToOptions {
}

declare interface VideoFrame {
    readonly format?: VideoPixelFormat
    readonly codedWidth: number
    readonly codedHeight: number
    readonly codedRect?: DOMRectReadOnly
    readonly visibleRect?: DOMRectReadOnly
    readonly displayWidth: number
    readonly displayHeight: number
    readonly duration?: number  // microseconds
    readonly timestamp?: number          // microseconds
    readonly colorSpace: VideoColorSpace

    allocationSize(options: VideoFrameCopyToOptions)

    clone(): VideoFrame

    close(): void

    // copyTo(destination:BufferSource, options?: VideoFrameCopyToOptions): Promise<sequence<PlaneLayout>>
}

declare var VideoFrame: {
    prototype: VideoFrame
    new(image: CanvasImageSource, init?: VideoFrameInit): VideoFrame

    new(data: BufferSource, init: VideoFrameBufferInit): VideoFrame
}

declare interface VideoEncoderEncodeOptions {
    keyFrame: boolean
}

declare interface VideoEncoder {
    configure(config: VideoEncoderConfig): void

    encode(frame: VideoFrame, options?: VideoEncoderEncodeOptions): void

    flush(): Promise<undefined>

    reset(): void

    close(): void

    readonly state: "unconfigured" | "configured" | "closed"
    readonly encodeQueueSize: number
}

declare var VideoEncoder: {
    prototype: VideoEncoder
    new(init: VideoEncoderInit): VideoEncoder
}

declare interface VideoEncoderConfig {
    codec: string
    description?: BufferSource
    codedWidth?: number
    codedHeight?: number
    displayAspectWidth?: number
    displayAspectHeight?: number
    colorSpace?: ColorSpace
    hardwareAcceleration?: "no-preference" | "prefer-hardware" | "prefer-software"
    optimizeForLatency?: boolean
}

declare interface VideoDecoderInit {
    output: (frame: VideoFrame) => void
    error: WebCodecsErrorCallback
}

declare interface VideoDecoder {
    configure(config: VideoEncoderConfig): void

    decode(chunk: EncodedVideoChunk): void
}

declare var VideoDecoder: {
    prototype: VideoDecoder
    new(init: VideoDecoderInit): VideoDecoder
}

declare interface WebMWriterInit {
    quality: number    // WebM image quality from 0.0 (worst) to 0.99999 (best), 1.00 (VP8L lossless) is not supported
    fileWriter?: any // FileWriter in order to stream to a file instead of buffering to memory (optional)
    fd?: any         // Node.js file handle to write to instead of buffering to memory (optional)

    // You must supply one of:
    frameDuration?: number // Duration of frames in milliseconds
    frameRate?: number     // Number of frames per second

    transparent?: boolean      // True if an alpha channel should be included in the video
    alphaQuality?: number // Allows you to set the quality level of the alpha channel separately.
}

declare interface WebMWriter {
    addFrame(canvas: HTMLCanvasElement): void

    complete(): Promise<Blob>
}

// https://github.com/thenickdude/webm-writer-js
declare var WebMWriter: {
    new(init: WebMWriterInit): WebMWriter
}