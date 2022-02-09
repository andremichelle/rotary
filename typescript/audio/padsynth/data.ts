export class Harmonic {
    static make(hz: number,
                bandWidth: number = 0.5,
                bandWidthScale: number = 1.01,
                brightness: number = -0.5,
                distance: number = 1.0,
                numHarmonics: number = 128
    ): Harmonic[] {
        const result = []
        for (let i = 0; i < numHarmonics; i++) {
            const position = i * distance + 1.0
            const level = Math.pow(position, brightness)
            const bw = (Math.pow(2.0, bandWidth / 1200.0) - 1.0) * Math.pow(position, bandWidthScale)
            result[i] = new Harmonic(position * hz, level, bw)
        }
        return result
    }

    /**x
     * @param position Usually integer values starting from 1
     * @param level multiplier [0,1]
     * @param bandWidth normalised band-width
     */
    constructor(public position: number,
                public level: number,
                public bandWidth: number) {
    }
}

export type Message =
    | { type: "init", fftSize: number, sampleRate: number }
    | { type: "create", harmonics: Harmonic[] }
    | { type: "created", wavetable: Float32Array }