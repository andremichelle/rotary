export declare class Metronome extends AudioWorkletNode {
    constructor(context: BaseAudioContext);
    rewind(): void;
    transport(moving: boolean): void;
    setBpm(value: number): void;
}
