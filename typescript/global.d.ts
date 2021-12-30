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