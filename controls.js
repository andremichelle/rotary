// TODO Move to typescript

export const configRepeatButton = (button, callback) => {
    button.addEventListener("mousedown", () => {
        let lastTime = Date.now()
        let delay = 500
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
        window.addEventListener("mouseup", () => lastTime = NaN, {once: true})
    })
}



export class NumericStepperConfigurator {
    constructor(parent) {
        this.parent = parent
    }
}

export const createNumericStepper = (parent, validator) => {
    const setValue = (value) => console.log(`setValue to ${value}`)
    const decreaseValue = () => console.log("decrease")
    const increaseValue = () => console.log("increase")

    const buttons = parent.querySelectorAll("button")
    configRepeatButton(buttons.item(0), decreaseValue)
    configRepeatButton(buttons.item(1), increaseValue)

    const input = parent.querySelector("input[type=text]")
    input.addEventListener("keydown", event => {
        switch (event.key) {
            case "ArrowUp": {
                event.preventDefault()
                increaseValue()
                input.select()
                break
            }
            case "ArrowDown": {
                event.preventDefault()
                decreaseValue()
                input.select()
                break
            }
        }
    })
    input.addEventListener("focusin", () => {
        window.addEventListener("mouseup", () => {
            if (input.selectionStart === input.selectionEnd) {
                input.select()
            }
        }, {once: true})
    })
    input.addEventListener("focusout", () => console.log("blur"))
    return {}
}