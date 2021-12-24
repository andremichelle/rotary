import {Events, ObservableValue, PrintMapping, Terminable, Terminator} from "./common"

export class NumericStepper implements Terminable {
    private readonly decreaseButton: HTMLButtonElement
    private readonly increaseButton: HTMLButtonElement
    private readonly input: HTMLInputElement
    private readonly terminator: Terminator = new Terminator()

    constructor(private readonly parent: HTMLElement,
                private readonly value: ObservableValue,
                private readonly mapping: PrintMapping<number> = PrintMapping.NoFloat,
                private readonly step: number = 1,
                private readonly unit: string = "") {
        const buttons = this.parent.querySelectorAll("button")
        this.decreaseButton = buttons.item(0)
        this.increaseButton = buttons.item(1)
        this.input = this.parent.querySelector("input[type=text]")

        this.connect()
        this.update()
    }

    connect() {
        this.terminator.with(this.value.addObserver(() => this.update()))
        this.terminator.with(Events.configRepeatButton(this.decreaseButton, () => this.decrease()))
        this.terminator.with(Events.configRepeatButton(this.increaseButton, () => this.increase()))
        this.terminator.with(Events.bindEventListener(this.input, "focusin", (focusEvent: FocusEvent) => {
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
                        this.increase()
                        this.input.select()
                        break
                    }
                    case "ArrowDown": {
                        event.preventDefault()
                        this.decrease()
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
                        if (isNaN(number) || !this.value.set(number)) {
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

    increase() {
        this.value.set(Math.round((this.value.get() + this.step) / this.step) * this.step)
    }

    decrease() {
        this.value.set(Math.round((this.value.get() - this.step) / this.step) * this.step)
    }

    parse(): number {
        return this.mapping.parse(this.value.mapping, this.input.value.replace(this.unit, "").trim())
    }

    update() {
        this.input.value = this.mapping.print(this.value.mapping, this.value.unipolar()) + this.unit
    }

    terminate() {
        this.terminator.terminate()
    }
}