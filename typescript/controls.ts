import {QuantizedValue} from "./common"

export const configRepeatButton = (button, callback) => {
    button.addEventListener("mousedown", () => {
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
    })
}

export class NumericStepperControl {
    public readonly decreaseButton: HTMLButtonElement
    public readonly increaseButton: HTMLButtonElement
    public readonly input: HTMLInputElement

    constructor(private readonly parent: HTMLElement,
                private readonly value: QuantizedValue<number>,
                private readonly unit: string = "") {
        const buttons = this.parent.querySelectorAll("button")
        this.decreaseButton = buttons.item(0)
        this.increaseButton = buttons.item(1)
        this.input = this.parent.querySelector("input[type=text]")
        this.connect()
    }

    connect() {
        configRepeatButton(this.decreaseButton, () => this.value.decrease())
        configRepeatButton(this.increaseButton, () => this.value.increase())

        this.value.addObserver(() => this.update())
        this.update()

        this.input.addEventListener("focusin", (focusEvent: FocusEvent) => {
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
        })
    }

    parse(): number {
        return parseFloat(this.input.value.replace(this.unit, "").trim())
    }

    update() {
        this.input.value = `${this.value.get()} ${this.unit}`
    }
}