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
    multiple?: boolean
    types?: PickerOptionType[]
}

// Hides error TS2339: Property 'text' does not exist on type 'File'
declare interface File extends Blob {
    text(): Promise<string>
}

declare interface Window {
    showOpenFilePicker(pickerOpts?: PickerOptions): Promise<FileSystemFileHandle[]>

    showSaveFilePicker(pickerOpts?: PickerOptions): Promise<FileSystemFileHandle>
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

declare interface EncodedVideoChunkMetadata {
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