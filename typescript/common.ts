export interface Terminable {
    terminate()
}

export class Events {
    static addEventListener(target: EventTarget, type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): Terminable {
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

export class Termination implements Terminable {
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