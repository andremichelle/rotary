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

export class SmoothStep {
    static fx(x: number) {
        return x * x * (3.0 - 2.0 * x)
    }

    static edge(edge0: number, edge1: number, x: number) {
        console.assert(0.0 <= edge0 && 1.0 >= edge0, `edge(${edge0}) must be between 0 and 1`)
        console.assert(0.0 <= edge1 && 1.0 >= edge1, `edge(${edge1}) must be between 0 and 1`)
        console.assert(edge0 !== edge1, `edge0(${edge0}) must not be equal to edge1(${edge1})`)
        return SmoothStep.fx((Math.max(0.0, Math.min(1.0, x)) - edge0) / (edge1 - edge0))
    }
}