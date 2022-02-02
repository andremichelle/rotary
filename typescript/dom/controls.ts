import {NumericInput, NumericStepperInput, SelectInput} from "./inputs.js"
import {NumericStepper, PrintMapping} from "../lib/common.js"

export class TwoColumnBuilder {
    private readonly container: HTMLDivElement = document.createElement("div")

    constructor() {
        this.container.classList.add("two-columns")
    }

    element(): HTMLElement {
        return this.container
    }

    createStepper(labelText: string, printMapping: PrintMapping<number>, stepper: NumericStepper): NumericStepperInput {
        const html = new DOMParser().parseFromString(`
                    <label class="name">${labelText}</label>
                    <fieldset class="stepper">
                        <button>◀︎</button>
                        <input type="text">
                        <button>▶</button>
                    </fieldset>`, "text/html")
            .body.querySelectorAll("*")
        const label = html.item(0) as HTMLElement
        const fieldset = html.item(1) as HTMLElement
        this.container.append(label)
        this.container.append(fieldset)
        return new NumericStepperInput(fieldset, printMapping, stepper)
    }

    createNumericInput(labelText: string, printMapping: PrintMapping<number>): NumericInput {
        const html = new DOMParser().parseFromString(`
                    <label class="name">${labelText}</label>
                    <input type="text" value="">`, "text/html")
            .body.querySelectorAll("*")
        const label = html.item(0) as HTMLLabelElement
        const input = html.item(1) as HTMLInputElement
        this.container.append(label)
        this.container.append(input)
        return new NumericInput(input, printMapping)
    }

    createSelect<T>(labelText: string, map: Map<string, T>): SelectInput<T> {
        const html = new DOMParser().parseFromString(`
                    <label class="name">${labelText}</label>
                    <select></select>`, "text/html")
            .body.querySelectorAll("*")
        const label = html.item(0) as HTMLElement
        const select = html.item(1) as HTMLSelectElement
        this.container.append(label)
        this.container.append(select)
        return new SelectInput<T>(select, map)
    }
}