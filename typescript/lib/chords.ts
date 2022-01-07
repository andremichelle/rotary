export class Chords {
    static Major = new Uint8Array([0, 2, 4, 5, 7, 9, 11])
    static Minor = new Uint8Array([0, 2, 3, 5, 7, 8, 10])
    static Semitones = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

    static toString(midiNote: number): string {
        const octave = Math.floor(midiNote / 12)
        const semitone = midiNote % 12
        return Chords.Semitones[semitone] + (octave - 2)
    }

    static toStrings(midiNotes): string {
        let result = ""
        for (let i = 0; i < midiNotes.length; ++i) {
            result += Chords.toString(midiNotes[i])
            if (i < midiNotes.length - 1)
                result += " "
        }
        return result
    }

    static compose(scale: Uint8Array, rootKey: number, variation: number, numKeys: number): Uint8Array {
        const chord = new Uint8Array(numKeys)
        for (let i = 0; i < numKeys; i++) {
            const index = variation + i * 2
            const interval = scale[index % 7] + Math.floor(index / 7) * 12
            chord[i] = rootKey + interval
        }
        return chord
    }
}