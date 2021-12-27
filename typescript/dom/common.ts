import {ObservableValue, Terminable, Terminator} from "../lib/common";

export class Dom {
    static bindEventListener(target: EventTarget,
                             type: string, listener: EventListenerOrEventListenerObject,
                             options?: AddEventListenerOptions): Terminable {
        target.addEventListener(type, listener, options)
        return {terminate: () => target.removeEventListener(type, listener, options)}
    }

    static insertElement(parent: Element, child: Element, index: number = Number.MAX_SAFE_INTEGER): void {
        if (index >= parent.children.length) {
            parent.appendChild(child)
        } else {
            parent.insertBefore(child, parent.children[index])
        }
    }

    static emptyElement(element: Element): void {
        while (element.hasChildNodes()) {
            element.lastChild.remove();
        }
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

export class Checkbox implements Terminable {
    private readonly terminator = new Terminator()

    constructor(private readonly element: HTMLInputElement, private readonly value: ObservableValue<boolean>) {
        this.init()
    }

    init(): void {
        this.element.checked = this.value.get()
        this.terminator.with(Dom.bindEventListener(this.element, "change", () => this.value.set(this.element.checked)))
        this.terminator.with(this.value.addObserver(value => this.element.checked = value.get()))
    }

    terminate() {
        this.terminator.terminate()
    }
}

export class SelectInput<T> implements Terminable {
    private readonly options = new Map<T, HTMLOptionElement>()
    private readonly terminator = new Terminator()
    private readonly values: T[] = []

    constructor(private readonly select: HTMLSelectElement,
                private readonly map: Map<string, T>,
                private readonly value: ObservableValue<T>) {
        this.terminator.with(Dom.bindEventListener(select, "change", () => {
            value.set(this.values[select.selectedIndex])
        }))
        this.terminator.with(value.addObserver(value => {
            this.options.get(value.get()).selected = true
        }))
        this.populate()
    }

    private populate() {
        this.map.forEach((some: T, key: string) => {
            const optionElement: HTMLOptionElement = document.createElement("OPTION") as HTMLOptionElement
            optionElement.textContent = key
            optionElement.selected = some === this.value.get()
            this.select.appendChild(optionElement)
            this.values.push(some)
            this.options.set(some, optionElement)
        })
    }

    terminate() {
        this.terminator.terminate()
    }
}