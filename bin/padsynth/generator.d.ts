import { Harmonic } from "./data.js";
export declare class Generator {
    private readonly worker;
    private readonly tasks;
    constructor(fftSize: number, sampleRate: number);
    render(harmonics: Harmonic[]): Promise<Float32Array>;
}
