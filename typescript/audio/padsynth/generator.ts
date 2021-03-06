import {Harmonic, Message} from "./data.js"

export class Generator {
    private readonly worker: Worker = new Worker("bin/audio/padsynth/worker.js", {type: "module"})
    private readonly tasks: ((value: Float32Array) => void)[] = []

    constructor(fftSize: number, sampleRate: number) {
        this.worker.onerror = ev => console.warn(ev)
        this.worker.onmessage = event => {
            const data = event.data as Message
            if (data.type === "created") {
                this.tasks.shift()(data.wavetable)
            }
        }
        this.worker.postMessage({type: "init", fftSize: fftSize, sampleRate: sampleRate})
    }

    async render(harmonics: Harmonic[]): Promise<Float32Array> {
        return new Promise(((resolve: (value: Float32Array) => void) => {
            this.tasks.push(resolve)
            this.worker.postMessage({type: "create", harmonics: harmonics})
        }))
    }
}