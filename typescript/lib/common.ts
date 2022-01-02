import {Random} from "./math"
import {Linear, Range, ValueMapping} from "./mapping"

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

export interface Option<T> {
    get(): T

    ifPresent(callback: (value: T) => void): void

    contains(value: T): boolean

    isEmpty(): boolean

    nonEmpty(): boolean
}

export class Options {
    static valueOf<T>(value: T): Option<T> {
        return null === value || undefined === value ? Options.None : new Options.Some(value)
    }

    static Some = class<T> implements Option<T> {
        constructor(readonly value: T) {
            console.assert(null !== value && undefined !== value, "Cannot be null or undefined")
        }

        get = (): T => this.value
        contains = (value: T): boolean => value === this.value
        ifPresent = (callback: (value: T) => void): void => callback(this.value)
        isEmpty = (): boolean => false
        nonEmpty = (): boolean => true

        toString(): string {
            return `Options.Some(${this.value})`
        }
    }

    static None = new class implements Option<never> {
        get = (): never => {
            throw new Error("Option has no value")
        }
        contains = (_: never): boolean => false
        ifPresent = (_: (value: never) => void): void => {
        }
        isEmpty = (): boolean => true
        nonEmpty = (): boolean => false

        toString(): string {
            return `Options.None`
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

    deserialize(format: T): Serializer<T>
}

export interface Value<T> {
    set(value: T): boolean

    get(): T
}

export interface ObservableValue<T> extends Value<T>, Observable<T> {
}

export class ObservableValueVoid implements ObservableValue<any> {
    static Instance = new ObservableValueVoid()

    addObserver(observer: Observer<any>): Terminable {
        return TerminableVoid.Instance
    }

    get(): any {
    }

    removeObserver(observer: Observer<any>): boolean {
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
    private readonly observable = new ObservableImpl<T>()

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
        this.observable.notify(value)
        return true
    }

    addObserver(observer: Observer<T>): Terminable {
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<T>): boolean {
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
    private readonly observable = new ObservableImpl<number>()

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
        this.observable.notify(value)
        return true
    }

    addObserver(observer: Observer<number>): Terminable {
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<number>): boolean {
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

    constructor(private readonly random: Random,
                private readonly resolution: number = 1024,
                private readonly roughness: number = 4.0,
                private readonly strength: number = 0.2) {
        this.values = UniformRandomMapping.monotoneRandom(random, resolution, roughness, strength)
    }

    // http://gamedev.stackexchange.com/questions/26391/is-there-a-family-of-monotonically-non-decreasing-noise-functions/26424#26424
    static monotoneRandom(random: Random, n: number, roughness: number, strength: number): Float32Array {
        const sequence = new Float32Array(n + 1)
        let sum = 0.0
        for (let i = 1; i <= n; ++i) {
            const x = Math.floor(random.nextDouble(0.0, roughness)) + 1.0
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