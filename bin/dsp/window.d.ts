export declare class Window {
    static generate(type: Window.Shape, n?: number): Float32Array;
}
export declare namespace Window {
    enum Shape {
        Bartlett = 0,
        Blackman = 1,
        BlackmanHarris = 2,
        Hamming = 3,
        Hanning = 4
    }
}
