export declare class DSP {
    static midiToHz: (note?: number, baseFrequency?: number) => number;
}
export declare const pulsarDelay: (context: AudioContext, input: AudioNode, output: AudioNode, delayTimeL: number, delayTimeR: number, delayTime: number, feedback: number, lpf: number, hpf: number) => void;
