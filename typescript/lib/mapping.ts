export abstract class Range {
    min: number
    max: number

    // noinspection JSUnusedLocalSymbols
    private constructor() {
    }

    clamp(value: number): number {
        return Math.min(this.max, Math.max(this.min, value))
    }
}

export interface ValueMapping<Y> {
    y(x: number): Y

    x(y: Y): number

    clamp(y: Y): Y
}

export class Linear implements ValueMapping<number>, Range {
    static Identity = new Linear(0.0, 1.0)
    static Bipolar = new Linear(-1.0, 1.0)
    static Percent = new Linear(0.0, 100.0)

    private readonly range: number

    constructor(readonly min: number, readonly max: number) {
        this.range = max - min
    }

    x(y: number): number {
        return (y - this.min) / this.range
    }

    y(x: number): number {
        return this.min + x * this.range
    }

    clamp(y: number): number {
        return Math.min(this.max, Math.max(this.min, y))
    }
}

export class LinearInteger implements ValueMapping<number>, Range {
    static Percent = new Linear(0, 100)

    readonly min: number
    readonly max: number
    private readonly range: number

    constructor(min: number, max: number) {
        this.max = max | 0
        this.min = min | 0
        this.range = max - min
    }

    x(y: number): number {
        return (y - this.min) / this.range
    }

    y(x: number): number {
        return (this.min + Math.round(x * this.range)) | 0
    }

    clamp(y: number): number {
        return Math.min(this.max, Math.max(this.min, y))
    }
}

export class Exp implements ValueMapping<number>, Range {
    readonly min: number
    readonly max: number
    private readonly range: number

    constructor(min: number, max: number) {
        this.max = max
        this.min = min
        this.range = Math.log(max / min)
    }

    x(y: number): number {
        return Math.log(y / this.min) / this.range
    }

    y(x: number): number {
        return this.min * Math.exp(x * this.range)
    }

    clamp(y: number): number {
        return Math.min(this.max, Math.max(this.min, y))
    }
}

export class Boolean implements ValueMapping<boolean> {
    x(y) {
        return y ? 1.0 : 0.0
    }

    y(x) {
        return x >= 0.5
    }

    clamp(y: boolean): boolean {
        return y
    }
}

/**
 * A proper level mapping based on db = a-b/(x+c) where x is unipolar [0,1]
 * Solved in Maxima: solve([min=a-b/c,max=a-b/(1+c),mid=a-b/(1/2+c)],[a,b,c]);
 */
export class Volume implements ValueMapping<number>, Range {
    static Default = new Volume()

    private readonly a: number
    private readonly b: number
    private readonly c: number

    /**
     * @param min The lowest decibel value [0.0]
     * @param mid The decibel value in the center [0.5]
     * @param max The highest decibel value [1.0]
     */
    constructor(readonly min = -72.0,
                readonly mid = -12.0,
                readonly max = 0.0) {
        const min2 = min * min
        const max2 = max * max
        const mid2 = mid * mid
        const tmp0 = min + max - 2.0 * mid
        const tmp1 = max - mid
        this.a = ((2.0 * max - mid) * min - mid * max) / tmp0
        this.b = (tmp1 * min2 + (mid2 - max2) * min + mid * max2 - mid2 * max)
            / (min2 + (2.0 * max - 4.0 * mid) * min + max2 - 4.0 * mid * max + 4 * mid2)
        this.c = -tmp1 / tmp0
    }

    y(x) {
        if (0.0 >= x) {
            return Number.NEGATIVE_INFINITY // in order to get a true zero gain
        }
        if (1.0 <= x) {
            return this.max
        }
        return this.a - this.b / (x + this.c)
    }

    x(y) {
        if (this.min >= y) {
            return 0.0
        }
        if (this.max <= y) {
            return 1.0
        }
        return -this.b / (y - this.a) - this.c
    }

    clamp(y: number): number {
        return Math.min(this.max, Math.max(this.min, y))
    }
}

export type Parser<Y> = (text: string) => Y | null
export type Printer<Y> = (value: Y) => string

export class PrintMapping<Y> {
    static UnipolarPercent = new PrintMapping(text => {
        const value = parseFloat(text)
        if (isNaN(value)) return null
        return value / 100.0
    }, value => (value * 100.0).toFixed(1), "", "%")
    static RGB = new PrintMapping<number>(text => {
        if (3 === text.length) {
            text = text.charAt(0) + text.charAt(0) + text.charAt(1) + text.charAt(1) + text.charAt(2) + text.charAt(2)
        }
        if (6 === text.length) {
            return parseInt(text, 16)
        } else {
            return null
        }
    }, value => value.toString(16).padStart(6, "0").toUpperCase(), "#", "")

    constructor(private readonly parser: Parser<Y>,
                private readonly printer: Printer<Y>,
                private readonly preUnit = "",
                private readonly postUnit = "") {
    }

    static integer(postUnit: string): PrintMapping<number> {
        return new PrintMapping(text => {
            const value = parseInt(text, 10)
            if (isNaN(value)) return null
            return value | 0
        }, value => String(value), "", postUnit)
    }

    parse(text: string): Y | null {
        return this.parser(text.replace(this.preUnit, "").replace(this.postUnit, ""))
    }

    print(value: Y): string {
        return undefined === value ? "" : `${this.preUnit}${this.printer(value)}${this.postUnit}`
    }
}