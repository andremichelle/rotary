export declare abstract class Random {
    nextDouble(min: number, max: number): number;
    nextInt(min: number, max: number): number;
    nextElement<T>(array: ArrayLike<T>): T;
    nextBoolean(): boolean;
    protected abstract uniform(): number;
}
export declare class JsRandom extends Random {
    static Instance: JsRandom;
    private constructor();
    protected uniform(): number;
}
export declare class Mulberry32 extends Random {
    seed: number;
    constructor(seed?: number);
    protected uniform(): number;
}
export declare class Function {
    static smoothStep(x: number): number;
    static tx(x: number, t: number): number;
    static step(edge0: number, edge1: number, x: number): number;
}
