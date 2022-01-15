import { Harmonic } from "./data.js";
export declare class Generator {
    private readonly worker;
    private readonly tasks;
    constructor(fftSize: number);
    render(harmonics: Harmonic[]): Promise<Float32Array>;
}
