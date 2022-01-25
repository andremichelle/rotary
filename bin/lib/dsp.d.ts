export declare const pulsarDelay: (context: AudioContext, input: AudioNode, output: AudioNode, delayTimeL: number, delayTimeR: number, delayTime: number, feedback: number, lpf: number, hpf: number) => void;
export declare const beep: (sampleRate: number, frequency: number, duration?: number) => Promise<AudioBuffer>;
