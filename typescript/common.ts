export interface Terminable {
    terminate()
}

export type Observer<VALUE> = (value: VALUE) => void

export interface Observable<VALUE> extends Terminable {
    addObserver(observer: Observer<VALUE>): Terminable

    removeObserver(observer: Observer<VALUE>): boolean
}

export interface Value<T> extends Observable<Value<T>> {
    set(value: T): boolean

    get(): T
}

export interface QuantizedValue<T> extends Value<T> {
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

export class LinearQuantizedValue implements QuantizedValue<number> {
    private readonly observable = new ObservableImpl<QuantizedValue<number>>()

    private value: number = 50

    constructor(public readonly min: number = 0, public readonly max: number = 100, public readonly step: number = 1) {
    }

    get() {
        return this.value
    }

    set(value): boolean { // TODO take step into account
        value = Math.min(this.max, Math.max(this.min, value))
        if (this.value === value) {
            return false
        }
        this.value = value
        this.observable.notify(this)
        return true
    }

    increase() {
        this.set(this.get() + this.step) // TODO div step floor comparison
    }

    decrease() {
        this.set(this.get() - this.step) // TODO div step ceil comparison
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