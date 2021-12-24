import {ObservableValue, Terminable, Terminator} from "../lib/common";

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

    static configEnumSelect<T>(select: HTMLSelectElement, map: Map<string, T>, value: ObservableValue<T>): Terminable {
        const options = new Map<T, HTMLOptionElement>()
        map.forEach((some: T, key: string) => {
            const optionElement: HTMLOptionElement = document.createElement("OPTION") as HTMLOptionElement
            optionElement.textContent = key
            optionElement.selected = some === value.get()
            select.appendChild(optionElement)
            options.set(some, optionElement)
        })
        const terminator = new Terminator()
        const values = Array.from(map)
        terminator.with(Events.bindEventListener(select, "change", () => {
            value.set(values[select.selectedIndex][1])
        }))
        terminator.with(value.addObserver(value => {
            options.get(value.get()).selected = true
        }))
        return {terminate: () => terminator.terminate()}
    }

    static configCheckbox(element: HTMLInputElement, value: ObservableValue<boolean>): Terminable {
        element.checked = value.get()
        const terminator = new Terminator()
        terminator.with(Events.bindEventListener(element, "change", () => value.set(element.checked)))
        terminator.with(value.addObserver(value => element.checked = value.get()))
        return {terminate: () => terminator.terminate()}
    }
}