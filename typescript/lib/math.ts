export interface Random {
    nextDouble(min: number, max: number): number
}

export class JsRandom implements Random {
    static Instance = new JsRandom()

    private constructor() {
    }

    nextDouble(min: number, max: number): number {
        return min + Math.random() * (max - min)
    }
}

export class Mulberry32 implements Random {
    constructor(private seed: number) {
    }

    nextDouble(min: number, max: number): number {
        return min + this.uniform() * (max - min)
    }

    private uniform(): number {
        let t = this.seed += 0x6D2B79F5
        t = Math.imul(t ^ t >>> 15, t | 1)
        t ^= t + Math.imul(t ^ t >>> 7, t | 61)
        return ((t ^ t >>> 14) >>> 0) / 4294967296.0
    }
}

export class Function {
    // https://www.desmos.com/calculator/gkpzjoxzcy
    static smoothStep(x: number) {
        return x * x * (3.0 - 2.0 * x)
    }

    // https://www.desmos.com/calculator/p7pjn3bb6h
    static tx(x: number, t: number) {
        t *= 1.0 - 1e-7
        return t < 0.0 ? (t * x + x) / (t * x + 1.0) : x / (t * x - t + 1.0)
    }

    static step(edge0: number, edge1: number, x: number) {
        return Math.min(1.0, Math.max(0.0, (x - edge0) / (edge1 - edge0)))
    }
}