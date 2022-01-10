export interface Random {
    nextDouble(min: number, max: number): number;
}
export declare class JsRandom implements Random {
    static Instance: JsRandom;
    private constructor();
    nextDouble(min: number, max: number): number;
}
export declare class Mulberry32 implements Random {
    private seed;
    constructor(seed: number);
    nextDouble(min: number, max: number): number;
    private uniform;
}
export declare class Function {
    static smoothStep(x: number): number;
    static tx(x: number, t: number): number;
    static step(edge0: number, edge1: number, x: number): number;
}
