export abstract class Random {
    public nextDouble(min: number, max: number): number {
        return min + this.uniform() * (max - min)
    }

    public nextInt(min: number, max: number): number {
        return min + Math.floor(this.uniform() * (max - min))
    }

    public nextElement<T>(array: ArrayLike<T>): T {
        return array[Math.floor(this.uniform() * array.length)]
    }

    public nextBoolean(): boolean {
        return this.uniform() < 0.5
    }

    protected abstract uniform(): number
}

export class JsRandom extends Random {
    static Instance = new JsRandom()

    private constructor() {
        super()
    }

    protected uniform(): number {
        return Math.random()
    }
}

export class Mulberry32 extends Random {
    seed: number

    constructor(seed = 0x12345678) {
        super()
        this.seed = seed | 0
    }

    protected uniform(): number {
        let t = this.seed += 0x6D2B79F5
        t = Math.imul(t ^ t >>> 15, t | 1)
        t ^= t + Math.imul(t ^ t >>> 7, t | 61)
        return ((t ^ t >>> 14) >>> 0) / 4294967296.0
    }
}

// noinspection JSUnusedGlobalSymbols
export class Func {
    // https://www.desmos.com/calculator/gkpzjoxzcy
    static smoothStep(x: number) {
        return x * x * (3.0 - 2.0 * x)
    }

    // https://www.shadertoy.com/view/MsSBRh
    static smoothStepInverse(y: number) {
        return 0.5 - Math.sin(Math.asin(1.0 - 2.0 * y) / 3.0)
    }

    static clamp(x: number): number {
        return Math.max(0.0, Math.min(1.0, x))
    }

    static mod(x: number): number {
        return x - Math.floor(x)
    }

    static switchSign(x: number, neg: boolean): number {
        return neg ? -x : +x
    }

    // https://www.desmos.com/calculator/p7pjn3bb6h
    static tx(x: number, t: number) {
        console.assert(0.0 <= x && x <= 1.0, `${x} out of bounds`)
        if (t === 0.0) return x
        t *= 1.0 - 1e-3
        return t < 0.0 ? (t * x + x) / (t * x + 1.0) : x / (t * x - t + 1.0)
    }

    static ty(y: number, t: number) {
        // noinspection JSSuspiciousNameCombination
        return Func.tx(y, -t)
    }

    static step(edge0: number, edge1: number, x: number) {
        return Math.min(1.0, Math.max(0.0, (x - edge0) / (edge1 - edge0)))
    }

    // https://www.desmos.com/calculator/dp5eq7gkbu
    static stairsMap(fx: (x: number) => number, x: number, fragments: number = 1.0, frequency: number = 1.0, delta: number = 0.0, reverse: boolean = false): number {
        const mx = fragments * (reverse ? 1.0 - x : x)
        const nx = Math.floor(mx)
        return frequency * (fx(mx - nx) + nx) / fragments + delta
    }

    static stairsInverse(fy: (y: number) => number, y: number, fragments: number = 1.0, frequency: number = 1.0, delta: number = 0.0, reverse: boolean = false): number {
        const my = fragments * (y - delta) / frequency
        const ny = Math.floor(my)
        const result = (fy(my - ny) + ny) / fragments
        return reverse ? 1.0 - result : result
    }
}
