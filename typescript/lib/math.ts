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