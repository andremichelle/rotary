import {RotaryFormat, RotaryModel} from "../rotary/model.js"

registerProcessor("rotary-playback", class extends AudioWorkletProcessor {
        private readonly model: RotaryModel = new RotaryModel()
        private loopInSeconds: number = 1.0
        private phase: number = 0.0
        private lastValues: Float32Array = new Float32Array(RotaryModel.MAX_TRACKS).fill(Number.MAX_VALUE)

        constructor() {
            super()

            this.port.onmessage = (event: MessageEvent) => {
                const data = event.data
                if (data.action === "format") {
                    this.model.deserialize(data.value as RotaryFormat)
                } else if (data.action === "loopInSeconds") {
                    this.loopInSeconds = data.value
                }
            }
        }

        // noinspection JSUnusedGlobalSymbols
        process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
            const tracks = this.model.tracks
            const phaseIncr = 1.0 / sampleRate
            for (let frameIndex = 0; frameIndex < 128; frameIndex++) {
                const localPhase = this.phase / this.loopInSeconds
                for (let trackIndex = 0; trackIndex < tracks.size(); trackIndex++) {
                    const track = tracks.get(trackIndex)
                    const x = track.ratio(localPhase)
                    const f = x - Math.floor(x)
                    const dx = this.lastValues[trackIndex] - f
                    if (dx < 0.0) {
                        const segmentIndex = track.index(localPhase)

                    }
                    this.lastValues[trackIndex] = f
                }
                this.phase += phaseIncr
            }
            return true
        }
    }
)