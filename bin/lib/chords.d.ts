export declare class Chords {
    static Major: Uint8Array;
    static Minor: Uint8Array;
    static Semitones: string[];
    static toString(midiNote: number): string;
    static toStrings(midiNotes: any): string;
    static compose(scale: Uint8Array, rootKey: number, variation: number, numKeys: number): Uint8Array;
}
