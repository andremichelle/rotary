export const TAU = Math.PI * 2.0

export interface Terminable {
    terminate(): void
}

export class TerminableVoid implements Terminable {
    static Instance = new TerminableVoid()

    terminate(): void {
    }
}

export class Terminator implements Terminable {
    private readonly terminables: Terminable[] = []

    with<T extends Terminable>(terminable: T): T {
        this.terminables.push(terminable)
        return terminable
    }

    terminate(): void {
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

    terminate(): void {
        this.observers.splice(0, this.observers.length)
    }
}

export interface Serializer<T> {
    serialize(): T

    deserialize(format: T): void
}

// noinspection JSUnusedLocalSymbols
export abstract class Range {
    min: number
    max: number

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

    terminate(): void {
    }
}

export enum CollectionEventType {
    Add, Remove, Order
}

// noinspection JSUnusedGlobalSymbols
export class CollectionEvent<T> {
    constructor(readonly collection: ObservableCollection<T>,
                readonly type: CollectionEventType,
                readonly item: T = null,
                readonly index: number = -1) {
    }
}

export class ObservableCollection<T> implements Observable<CollectionEvent<T>> {
    private readonly observable = new ObservableImpl<CollectionEvent<T>>()

    private readonly values: T[] = []

    add(value: T, index: number = Number.MAX_SAFE_INTEGER): boolean {
        console.assert(0 <= index)
        index = Math.min(index, this.values.length)
        if (this.values.includes(value)) return false
        this.values.splice(index, 0, value)
        this.observable.notify(new CollectionEvent(this, CollectionEventType.Add, value, index))
        return true
    }

    addAll(values: T[]): void {
        for (const value of values) {
            this.add(value)
        }
    }

    remove(value: T): boolean {
        return this.removeIndex(this.values.indexOf(value))
    }

    removeIndex(index: number) {
        if (-1 === index) return false
        const removed: T[] = this.values.splice(index, 1)
        if (0 === removed.length) return false
        this.observable.notify(new CollectionEvent(this, CollectionEventType.Remove, removed[0], index))
        return true
    }

    clear() {
        for (let index = this.values.length - 1; index > -1; index--) {
            this.removeIndex(index)
        }
    }

    get(index: number): T {
        return this.values[index]
    }

    indexOf(value: T): number {
        return this.values.indexOf(value)
    }

    size(): number {
        return this.values.length
    }

    map<U>(fn: (value: T, index: number, array: T[]) => U): U[] {
        const arr: U[] = []
        for (let i = 0; i < this.values.length; i++) {
            arr[i] = fn(this.values[i], i, this.values)
        }
        return arr
    }

    forEach(fn: (value: T, index: number) => void): void {
        for (let i = 0; i < this.values.length; i++) {
            fn(this.values[i], i)
        }
    }

    reduce<U>(fn: (previousValue: U, currentValue: T, currentIndex: number) => U, initialValue: U): U {
        let value: U = initialValue
        for (let i = 0; i < this.values.length; i++) {
            value = fn(value, this.values[i], i)
        }
        return value
    }

    addObserver(observer: Observer<CollectionEvent<T>>): Terminable {
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<CollectionEvent<T>>): boolean {
        return this.observable.removeObserver(observer)
    }

    terminate(): void {
        this.observable.terminate()
    }
}

export class ObservableValueImpl<T> implements ObservableValue<T> {
    private readonly observable = new ObservableImpl<ObservableValueImpl<T>>()

    constructor(private value: T) {
    }

    get(): T {
        return this.value
    }

    set(value: T): boolean {
        if (this.value === value) {
            return false
        }
        this.value = value
        this.observable.notify(this)
        return true
    }

    addObserver(observer: Observer<ObservableValueImpl<T>>): Terminable {
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<ObservableValueImpl<T>>): boolean {
        return this.observable.removeObserver(observer)
    }

    terminate(): void {
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

export class BoundNumericValue implements ObservableValue<number> {
    private readonly observable = new ObservableImpl<BoundNumericValue>()

    constructor(private readonly range: Range = Linear.Identity,
                private value: number = 0.5) {
    }

    get(): number {
        return this.value
    }

    set(value: number): boolean {
        value = this.range.clamp(value)
        if (this.value === value) {
            return false
        }
        this.value = value
        this.observable.notify(this)
        return true
    }

    addObserver(observer: Observer<BoundNumericValue>): Terminable {
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<BoundNumericValue>): boolean {
        return this.observable.removeObserver(observer)
    }

    terminate(): void {
        this.observable.terminate()
    }
}

export const binarySearch = (values: Float32Array, key: number): number => {
    let low = 0 | 0
    let high = (values.length - 1) | 0
    while (low <= high) {
        const mid = (low + high) >>> 1
        const midVal = values[mid]
        if (midVal < key)
            low = mid + 1
        else if (midVal > key)
            high = mid - 1
        else {
            if (midVal === key)
                return mid
            else if (midVal < key)
                low = mid + 1
            else
                high = mid - 1
        }
    }
    return high
}

export class UniformRandomMapping implements ValueMapping<number> {
    private readonly values: Float32Array

    constructor(private readonly resolution: number = 1024,
                private readonly roughness: number = 4.0,
                private readonly strength: number = 0.2) {
        this.values = UniformRandomMapping.monotoneRandom(resolution, roughness, strength)
    }

    // http://gamedev.stackexchange.com/questions/26391/is-there-a-family-of-monotonically-non-decreasing-noise-functions/26424#26424
    static monotoneRandom(n: number, roughness: number, strength: number): Float32Array {
        const sequence = new Float32Array(n + 1)
        let sum = 0.0
        for (let i = 1; i <= n; ++i) {
            const x = Math.floor(Math.random() * roughness) + 1.0
            sum += x
            sequence[i] = x
        }
        let nominator = 0.0
        for (let i = 1; i <= n; ++i) {
            nominator += sequence[i]
            sequence[i] = (nominator / sum) * strength + (1.0 - strength) * i / n
        }
        return sequence
    }

    clamp(y: number): number {
        return Math.max(0.0, Math.min(1.0, y))
    }

    x(y: number): number {
        if (y <= 0.0) return 0.0
        if (y >= 1.0) return 1.0
        const index = binarySearch(this.values, y)
        const a = this.values[index]
        const b = this.values[index + 1]
        const nInverse = 1.0 / this.resolution
        return index * nInverse + nInverse / (b - a) * (y - a)
    }

    y(x: number): number {
        if (x <= 0.0) return 0.0
        if (x >= 1.0) return 1.0
        const xd = x * this.resolution
        const xi = xd | 0
        const a = xd - xi
        const q = this.values[xi]
        return q + a * (this.values[xi + 1] - q)
    }
}