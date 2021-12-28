export const TAU = Math.PI * 2.0

export interface Terminable {
    terminate()
}

export class TerminableVoid implements Terminable {
    static Instance = new TerminableVoid()

    terminate() {
    }
}

export class Terminator implements Terminable {
    private readonly terminables: Terminable[] = []

    with<T extends Terminable>(terminable: T): T {
        this.terminables.push(terminable)
        return terminable
    }

    terminate() {
        while (this.terminables.length) {
            this.terminables.pop().terminate()
        }
    }
}

export type Observer<VALUE> = (value: VALUE) => void

export interface Observable<VALUE> extends Terminable {
    addObserver(observer: Observer<VALUE>): Terminable

    removeObserver(observer: Observer<VALUE>): boolean
}

export class ObservableImpl<T> implements Observable<T> {
    private readonly observers: Observer<T>[] = []

    notify(value: T) {
        this.observers.forEach(observer => observer(value))
    }

    addObserver(observer: Observer<T>): Terminable {
        this.observers.push(observer)
        return {terminate: () => this.removeObserver(observer)}
    }

    removeObserver(observer: Observer<T>): boolean {
        let index = this.observers.indexOf(observer)
        if (-1 < index) {
            this.observers.splice(index, 1)
            return true
        }
        return false
    }

    terminate() {
        this.observers.splice(0, this.observers.length)
    }
}

export interface ValueMapping<Y> {
    y(x: number): Y

    x(y: Y): number

    clamp(y: Y): Y
}

export class Linear implements ValueMapping<number> {
    static Identity = new Linear(0.0, 1.0)
    static Bipolar = new Linear(-1.0, 1.0)
    static Percent = new Linear(0.0, 100.0)

    private readonly range: number

    constructor(private readonly min: number, private readonly max: number) {
        this.range = max - min
    }

    x(y: number): number {
        return (y - this.min) / this.range
    }

    y(x: number): number {
        return this.min + x * this.range
    }

    clamp(y: number): number {
        return Math.min(this.max, Math.max(this.min, y));
    }
}

export class LinearInteger implements ValueMapping<number> {
    static Percent = new Linear(0, 100)

    private readonly min: number
    private readonly max: number
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
        return Math.min(this.max, Math.max(this.min, y));
    }
}

export class Exp implements ValueMapping<number> {
    private readonly min: number
    private readonly max: number
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
        return Math.min(this.max, Math.max(this.min, y));
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
        return y;
    }
}

/**
 * A proper level mapping based on db = a-b/(x+c) where x is unipolar [0,1]
 * Solved in Maxima: solve([min=a-b/c,max=a-b/(1+c),mid=a-b/(1/2+c)],[a,b,c]);
 */
export class Volume implements ValueMapping<number> {
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
        const min2 = min * min;
        const max2 = max * max;
        const mid2 = mid * mid;
        const tmp0 = min + max - 2.0 * mid;
        const tmp1 = max - mid;
        this.a = ((2.0 * max - mid) * min - mid * max) / tmp0;
        this.b = (tmp1 * min2 + (mid2 - max2) * min + mid * max2 - mid2 * max)
            / (min2 + (2.0 * max - 4.0 * mid) * min + max2 - 4.0 * mid * max + 4 * mid2);
        this.c = -tmp1 / tmp0;
    }

    y(x) {
        if (0.0 >= x) {
            return Number.NEGATIVE_INFINITY; // in order to get a true zero gain
        }
        if (1.0 <= x) {
            return this.max;
        }
        return this.a - this.b / (x + this.c);
    }

    x(y) {
        if (this.min >= y) {
            return 0.0;
        }
        if (this.max <= y) {
            return 1.0;
        }
        return -this.b / (y - this.a) - this.c;
    }

    clamp(y: number): number {
        return Math.min(this.max, Math.max(this.min, y));
    }
}

export type Parser<Y> = (text: string) => Y | null
export type Printer<Y> = (value: Y) => string

export class PrintMapping<Y> {
    static integer(postUnit: string): PrintMapping<number> {
        return new PrintMapping(text => {
            const value = parseInt(text, 10)
            if (isNaN(value)) return null
            return value | 0
        }, value => String(value), "", postUnit)
    }

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

    parse(text: string): Y | null {
        return this.parser(text.replace(this.preUnit, "").replace(this.postUnit, ""))
    }

    print(value: Y): string {
        return `${this.preUnit}${this.printer(value)}${this.postUnit}`
    }
}

export interface Value<T> {
    set(value: T): boolean

    get(): T
}

export interface ObservableValue<T> extends Value<T>, Observable<ObservableValue<T>> {
}

export class ObservableValueVoid implements ObservableValue<any> {
    static Instance = new ObservableValueVoid()

    addObserver(observer: Observer<ObservableValue<any>>): Terminable {
        return TerminableVoid.Instance
    }

    get(): any {
        return undefined
    }

    removeObserver(observer: Observer<ObservableValue<any>>): boolean {
        return false
    }

    set(value: any): boolean {
        return true
    }

    terminate() {
    }
}

export class ObservableValueImpl<T> implements ObservableValue<T> {
    private readonly observable = new ObservableImpl<ObservableValueImpl<T>>()

    constructor(private value: T) {
    }

    get(): T {
        return this.value;
    }

    set(value: T): boolean {
        if (this.value === value) {
            return false
        }
        this.value = value
        this.observable.notify(this)
        return true;
    }

    addObserver(observer: Observer<ObservableValueImpl<T>>): Terminable {
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<ObservableValueImpl<T>>): boolean {
        return this.observable.removeObserver(observer)
    }

    terminate() {
        this.observable.terminate()
    }
}

export interface Stepper {
    decrease(value: ObservableValue<number>): void

    increase(value: ObservableValue<number>): void
}

export class NumericStepper implements Stepper {
    static Integer = new NumericStepper(1)
    static FloatPercent = new NumericStepper(0.01)

    constructor(private readonly step: number = 1) {
    }

    decrease(value: ObservableValue<number>): void {
        value.set(Math.round((value.get() - this.step) / this.step) * this.step)
    }

    increase(value: ObservableValue<number>): void {
        value.set(Math.round((value.get() + this.step) / this.step) * this.step)
    }
}

export class Parameter implements ObservableValue<number> {
    private readonly observable = new ObservableImpl<Parameter>()

    constructor(readonly mapping: ValueMapping<number> = Linear.Identity,
                private value: number = 0.5) {
    }

    get(): number {
        return this.value;
    }

    unipolar(): number {
        return this.mapping.x(this.value)
    }

    set(value: number): boolean {
        value = this.mapping.clamp(value)
        if (this.value === value) {
            return false
        }
        this.value = value
        this.observable.notify(this)
        return true
    }

    addObserver(observer: Observer<Parameter>): Terminable {
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<Parameter>): boolean {
        return this.observable.removeObserver(observer)
    }

    terminate() {
        this.observable.terminate()
    }
}