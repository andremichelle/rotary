import {CreatedMessage, CreateMessage, Harmonic, InitMessage} from "./data.js"

export class Generator {
    private readonly worker: Worker = new Worker("bin/padsynth/worker.js", {type: "module"})
    private readonly tasks: ((value: Float32Array) => void)[] = []

    constructor(fftSize: number) {
        this.worker.onerror = ev => console.warn(ev)
        this.worker.onmessage = event => {
            const data = event.data as CreatedMessage
            this.tasks.shift()(data.wavetable)
        }
        this.worker.postMessage(new InitMessage(fftSize))
    }

    async render(harmonics: Harmonic[]): Promise<Float32Array> {
        return new Promise(((resolve: (value: Float32Array) => void) => {
            this.tasks.push(resolve)
            this.worker.postMessage(new CreateMessage(harmonics))
        }))
    }
}