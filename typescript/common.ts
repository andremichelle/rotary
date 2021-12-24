export interface Terminable {
    terminate()
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

export class Events {
    static bindEventListener(target: EventTarget,
                             type: string, listener: EventListenerOrEventListenerObject,
                             options?: AddEventListenerOptions): Terminable {
        target.addEventListener(type, listener, options)
        return {terminate: () => target.removeEventListener(type, listener, options)}
    }

    static configRepeatButton(button, callback): Terminable {
        const mouseDownListener = () => {
            let lastTime = Date.now()
            let delay = 500.0
            const repeat = () => {
                if (!isNaN(lastTime)) {
                    if (Date.now() - lastTime > delay) {
                        lastTime = Date.now()
                        delay *= 0.75
                        callback()
                    }
                    requestAnimationFrame(repeat)
                }
            }
            requestAnimationFrame(repeat)
            callback()
            window.addEventListener("mouseup", () => {
                lastTime = NaN
                delay = Number.MAX_VALUE
            }, {once: true})
        };
        button.addEventListener("mousedown", mouseDownListener)
        return {terminate: () => button.removeEventListener("mousedown", mouseDownListener)}
    }
}

export type Observer<VALUE> = (value: VALUE) => void

export interface Observable<VALUE> extends Terminable {
    addObserver(observer: Observer<VALUE>): Terminable

    removeObserver(observer: Observer<VALUE>): boolean
}

export interface ValueMapping<Y> {
    y(x: number): Y

    x(y: Y): number
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
}

export class LinearInteger implements ValueMapping<number> {
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
}

export class Boolean implements ValueMapping<boolean> {
    x(y) {
        return y ? 1.0 : 0.0
    }

    y(x) {
        return x >= 0.5
    }
}

// A proper level mapping based on db = a-b/(x+c) where x is unipolar [0,1]
// Solved in Maxima: solve([min=a-b/c,max=a-b/(1+c),mid=a-b/(1/2+c)],[a,b,c]);
export class Volume implements ValueMapping<number> {
    static Default = new Volume()

    private readonly a: number
    private readonly b: number
    private readonly c: number

    // min - The lowest decibel value [0.0]
    // mid - The decibel value in the center [0.5]
    // max - The highest decibel value [1.0]
    constructor(public readonly min = -72.0,
                public readonly mid = -12.0,
                public readonly max = 0.0) {
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
}

export type Parser<Y> = (mapping: ValueMapping<Y>, text: string) => Y
export type Printer<Y> = (mapping: ValueMapping<Y>, unipolar: number) => string

export class PrintMapping<Y> {
    static UnipolarParser = (mapping: ValueMapping<number>, text: string): number => {
        if (text.includes("%")) {
            return mapping.y(parseFloat(text) / 100.0)
        }
        const value = parseFloat(text)
        if (isNaN(value)) {
            return NaN
        }
        return mapping.y(Math.min(1.0, Math.max(0.0, mapping.x(value))))
    }

    static BipolarParser = (mapping: ValueMapping<number>, text: string): number => {
        const float = parseFloat(text)
        if (isNaN(float)) {
            return NaN
        }
        return mapping.y(Math.min(1.0, Math.max(0.0, float / 200.0 + 0.5)))
    }

    static createPrintMapping(parser: (mapping: ValueMapping<number>, text: string) =>
        number = PrintMapping.UnipolarParser, numFraction: number): PrintMapping<number> {
        return new PrintMapping<number>(parser,
            (mapping, unipolar) =>
                mapping.y(unipolar).toFixed(numFraction))
    }

    static NoFloat = PrintMapping.createPrintMapping(PrintMapping.UnipolarParser, 0)
    static OneFloats = PrintMapping.createPrintMapping(PrintMapping.UnipolarParser, 1)
    static TwoFloats = PrintMapping.createPrintMapping(PrintMapping.UnipolarParser, 2)
    static ThreeFloats = PrintMapping.createPrintMapping(PrintMapping.UnipolarParser, 3)

    constructor(private readonly parser: Parser<Y>,
                private readonly printer: Printer<Y>) {
    }

    parse(mapping: ValueMapping<Y>, text: string): Y {
        return this.parser(mapping, text)
    }

    print(mapping: ValueMapping<Y>, unipolar: number): string {
        return this.printer(mapping, unipolar)
    }
}

export interface Value<T> extends Observable<Value<T>> {
    set(value: T): boolean

    get(): T
}

export interface Stepper {
    decrease()

    increase()
}

export class ObservableImpl<VALUE> implements Observable<VALUE> {
    private readonly observers: Observer<VALUE>[] = []

    notify(value: VALUE) {
        this.observers.forEach(observer => observer(value))
    }

    addObserver(observer: Observer<VALUE>): Terminable {
        this.observers.push(observer)
        return {terminate: () => this.removeObserver(observer)}
    }

    removeObserver(observer: Observer<VALUE>): boolean {
        let index = this.observers.length | 0
        while (--index > -1) {
            if (this.observers[index] === observer) {
                this.observers.splice(index, 1)
                return
            }
        }
    }

    terminate() {
        this.observers.splice(0, this.observers.length)
    }
}

export class LinearQuantizedValue implements Value<number>, Stepper {
    private readonly observable = new ObservableImpl<LinearQuantizedValue>()

    constructor(private value: number = 50,
                public readonly min: number = 0,
                public readonly max: number = 100,
                public readonly step: number = 1) {
    }

    get() {
        return this.value
    }

    set(value): boolean {
        value = Math.min(this.max, Math.max(this.min, value))
        value = Math.round(value / this.step) * this.step
        if (this.value === value) {
            return false
        }
        this.value = value
        this.observable.notify(this)
        return true
    }

    increase() {
        this.set(this.get() + this.step)
    }

    decrease() {
        this.set(this.get() - this.step)
    }

    addObserver(observer: Observer<LinearQuantizedValue>): Terminable {
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<LinearQuantizedValue>): boolean {
        return this.observable.removeObserver(observer)
    }

    terminate() {
        this.observable.terminate()
    }
}