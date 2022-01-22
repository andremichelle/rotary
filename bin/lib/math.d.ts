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
export declare class Func {
    static smoothStep(x: number): number;
    static clamp(x: number): number;
    static mod(x: number): number;
    static switchSign(x: number, neg: boolean): number;
    static tx(x: number, t: number): number;
    static step(edge0: number, edge1: number, x: number): number;
    static stairsMap(fx: (x: number) => number, x: number, fragment?: number, frequency?: number): number;
    static stairsInverse(fx: (x: number) => number, x: number, fragment?: number, frequency?: number): number;
}
