import {Events, LinearQuantizedValue, Terminable, Terminator} from "./common"

export class NumericStepperControl implements Terminable {
    private readonly decreaseButton: HTMLButtonElement
    private readonly increaseButton: HTMLButtonElement
    private readonly input: HTMLInputElement
    private readonly numFractions: number
    private readonly terminator: Terminator = new Terminator()

    constructor(private readonly parent: HTMLElement,
                private readonly value: LinearQuantizedValue,
                private readonly unit: string = "") {
        const buttons = this.parent.querySelectorAll("button")
        this.decreaseButton = buttons.item(0)
        this.increaseButton = buttons.item(1)
        this.input = this.parent.querySelector("input[type=text]")

        const both = value.step.toString(10).split(".")
        this.numFractions = 1 >= both.length ? 0 : both[1].length
        this.connect()
        this.update()
    }

    connect() {
        this.terminator.with(this.value.addObserver(() => this.update()))
        this.terminator.with(Events.configRepeatButton(this.decreaseButton, () => this.value.decrease()))
        this.terminator.with(Events.configRepeatButton(this.increaseButton, () => this.value.increase()))
        this.terminator.with(Events.bindEventListener(this.input, "focusin", (focusEvent: FocusEvent) => {
            const blur = (() => {
                const lastFocus: HTMLElement = focusEvent.relatedTarget as HTMLElement
                return () => {
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
                        this.value.increase()
                        this.input.select()
                        break
                    }
                    case "ArrowDown": {
                        event.preventDefault()
                        this.value.decrease()
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

    parse(): number {
        return parseFloat(this.input.value.replace(this.unit, "").trim())
    }

    update() {
        const number = this.value.get()
        this.input.value = `${0 < this.numFractions ? number.toFixed(this.numFractions) : number} ${this.unit}`
    }

    terminate() {
        this.terminator.terminate()
    }
}