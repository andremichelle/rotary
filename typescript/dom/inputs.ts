import {Dom} from "./common";
import {NumericStepper, ObservableValue, Parameter, PrintMapping, Terminable, Terminator} from "../lib/common"

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

export class NumericStepperInput implements Terminable {
    private readonly decreaseButton: HTMLButtonElement
    private readonly increaseButton: HTMLButtonElement
    private readonly input: HTMLInputElement
    private readonly terminator: Terminator = new Terminator()

    constructor(private readonly parent: HTMLElement,
                private readonly parameter: Parameter,
                private readonly printMapping: PrintMapping<number>,
                private readonly stepper: NumericStepper) {
        const buttons = this.parent.querySelectorAll("button")
        this.decreaseButton = buttons.item(0)
        this.increaseButton = buttons.item(1)
        this.input = this.parent.querySelector("input[type=text]")

        this.connect()
        this.update()
    }

    connect() {
        this.terminator.with(this.parameter.addObserver(() => this.update()))
        this.terminator.with(Dom.configRepeatButton(this.decreaseButton, () => this.stepper.decrease(this.parameter)))
        this.terminator.with(Dom.configRepeatButton(this.increaseButton, () => this.stepper.increase(this.parameter)))
        this.terminator.with(Dom.bindEventListener(this.input, "focusin", (focusEvent: FocusEvent) => {
            const blur = (() => {
                const lastFocus: HTMLElement = focusEvent.relatedTarget as HTMLElement
                return () => {
                    this.input.setSelectionRange(0, 0)
                    if (lastFocus === null) {
                        this.input.blur()
                    } else {
                        lastFocus.focus()
                    }
                }
            })()
            const keyboardListener = (event: KeyboardEvent) => {
                switch (event.key) {
                    case "ArrowUp": {
                        event.preventDefault()
                        this.stepper.increase(this.parameter)
                        this.input.select()
                        break
                    }
                    case "ArrowDown": {
                        event.preventDefault()
                        this.stepper.decrease(this.parameter)
                        this.input.select()
                        break
                    }
                    case "Escape": {
                        event.preventDefault()
                        this.update()
                        blur()
                        break
                    }
                    case "Enter": {
                        event.preventDefault()
                        const number = this.parse()
                        if (null === number || !this.parameter.set(number)) {
                            this.update()
                        }
                        blur()
                    }
                }
            }
            this.input.addEventListener("focusout", () =>
                this.input.removeEventListener("keydown", keyboardListener), {once: true})
            this.input.addEventListener("keydown", keyboardListener)
            window.addEventListener("mouseup", () => {
                if (this.input.selectionStart === this.input.selectionEnd) this.input.select()
            }, {once: true})
        }))
    }

    parse(): number | null {
        return this.printMapping.parse(this.input.value)
    }

    update() {
        this.input.value = this.printMapping.print(this.parameter.get())
    }

    terminate() {
        this.terminator.terminate()
    }
}

export class NumericInput implements Terminable {
    private readonly terminator: Terminator = new Terminator()

    constructor(private readonly input: HTMLInputElement,
                private readonly value: ObservableValue<number>,
                private readonly printMapping: PrintMapping<number>) {
        this.connect()
        this.update()
    }

    connect() {
        this.terminator.with(this.value.addObserver(() => this.update()))
        this.terminator.with(Dom.bindEventListener(this.input, "focusin", (focusEvent: FocusEvent) => {
            const blur = (() => {
                const lastFocus: HTMLElement = focusEvent.relatedTarget as HTMLElement
                return () => {
                    this.input.setSelectionRange(0, 0)
                    if (lastFocus === null) {
                        this.input.blur()
                    } else {
                        lastFocus.focus()
                    }
                }
            })()
            const keyboardListener = (event: KeyboardEvent) => {
                switch (event.key) {
                    case "Escape": {
                        event.preventDefault()
                        this.update()
                        blur()
                        break
                    }
                    case "Enter": {
                        event.preventDefault()
                        const number = this.parse()
                        if (null === number || !this.value.set(number)) {
                            this.update()
                        }
                        blur()
                    }
                }
            }
            this.input.addEventListener("focusout", () =>
                this.input.removeEventListener("keydown", keyboardListener), {once: true})
            this.input.addEventListener("keydown", keyboardListener)
            window.addEventListener("mouseup", () => {
                if (this.input.selectionStart === this.input.selectionEnd) this.input.select()
            }, {once: true})
        }))
    }

    parse(): number | null {
        return this.printMapping.parse(this.input.value)
    }

    update() {
        this.input.value = this.printMapping.print(this.value.get())
    }

    terminate() {
        this.terminator.terminate()
    }
}