export declare class FFT {
    private readonly n;
    static reverse(i: number): number;
    private readonly levels;
    private readonly cosTable;
    private readonly sinTable;
    constructor(n: number);
    process(real: Float32Array, imag: Float32Array): void;
}
