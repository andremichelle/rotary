export declare const pulsarDelay: (context: BaseAudioContext, input: AudioNode, output: AudioNode, delayTimeL: number, delayTimeR: number, delayTime: number, feedback: number, lpf: number, hpf: number) => void;
export declare const cycle: (sampleRate: number, frequency: number) => Promise<AudioBuffer>;
export declare const beep: (sampleRate: number, frequency: number, duration?: number) => Promise<AudioBuffer>;
