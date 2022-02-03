import {Checkbox, NumericInput, NumericStepperInput, SelectInput} from "./inputs.js"
import {NumericStepper, PrintMapping, Terminable, Terminator} from "../lib/common.js"

class NumericInputFactory {
    static create(printMapping: PrintMapping<number>): [HTMLInputElement, NumericInput] {
        const htmlElement = NumericInputFactory.createElement()
        return [htmlElement, new NumericInput(htmlElement, printMapping)]
    }

    private static createElement(): HTMLInputElement {
        return NumericInputFactory.instance.template.cloneNode(true) as HTMLInputElement
    }

    private static instance = new NumericInputFactory()

    private readonly template: HTMLInputElement = new DOMParser().parseFromString(`
                    <input type="text">`, "text/html")
        .body.querySelectorAll("input").item(0)

    private constructor() {
    }
}

class NumericStepperInputFactory {
    static create(printMapping: PrintMapping<number>, stepper: NumericStepper): [HTMLFieldSetElement, NumericStepperInput] {
        const htmlElement = NumericStepperInputFactory.createElement()
        return [htmlElement, new NumericStepperInput(htmlElement, printMapping, stepper)]
    }

    private static createElement(): HTMLFieldSetElement {
        return NumericStepperInputFactory.template.cloneNode(true) as HTMLFieldSetElement
    }

    private static readonly template: HTMLFieldSetElement = new DOMParser().parseFromString(`
                    <fieldset class="stepper">
                        <button>◀︎</button>
                        <input type="text">
                        <button>▶</button>
                    </fieldset>`, "text/html")
        .body.querySelectorAll("fieldset").item(0)

    private constructor() {
    }
}

class SelectInputFactory {
    static create<T>(map: Map<string, T>): [HTMLElement, SelectInput<T>] {
        const htmlElement = SelectInputFactory.createElement()
        return [htmlElement, new SelectInput(htmlElement, map)]
    }

    private static createElement(): HTMLSelectElement {
        return SelectInputFactory.instance.template.cloneNode(true) as HTMLSelectElement
    }

    private static instance = new SelectInputFactory()

    private readonly template: HTMLSelectElement = new DOMParser().parseFromString(`<select></select>`, "text/html")
        .body.querySelectorAll("select").item(0)

    private constructor() {
    }
}

class CheckboxFactory {
    static create<T>(): [HTMLElement, Checkbox] {
        const htmlElement = CheckboxFactory.createElement()
        return [htmlElement, new Checkbox(htmlElement.querySelector("input"))]
    }

    private static createElement(): HTMLLabelElement {
        return CheckboxFactory.instance.template.cloneNode(true) as HTMLLabelElement
    }

    private static instance = new CheckboxFactory()

    private readonly template: HTMLLabelElement = new DOMParser().parseFromString(`
            <label class="checkbox slider">
                <input type="checkbox"/>
                <span></span>
            </label>
          `, "text/html")
        .body.querySelectorAll("label").item(0)

    private constructor() {
    }
}

export class UIControllerLayout implements Terminable {
    private readonly terminator: Terminator = new Terminator()

    constructor(private readonly container?: HTMLElement) {
        if (container === undefined) {
            this.container = document.createElement("div")
            this.container.classList.add("two-columns")
        } else {
            console.assert(this.container.classList.contains("two-columns"))
        }
    }

    element(): HTMLElement {
        return this.container
    }

    createNumericStepper(labelText: string, printMapping: PrintMapping<number>, stepper: NumericStepper): NumericStepperInput {
        const input = NumericStepperInputFactory.create(printMapping, stepper)
        this.append(UIControllerLayout.createLabel(labelText), input[0])
        return this.terminator.with(input[1])
    }

    createNumericInput(labelText: string, printMapping: PrintMapping<number>): NumericInput {
        const input = NumericInputFactory.create(printMapping)
        this.append(UIControllerLayout.createLabel(labelText), input[0])
        return this.terminator.with(input[1])
    }

    createSelect<T>(labelText: string, map: Map<string, T>): SelectInput<T> {
        const input = SelectInputFactory.create(map)
        this.append(UIControllerLayout.createLabel(labelText), input[0])
        return this.terminator.with(input[1])
    }

    createCheckbox(labelText: string): Checkbox {
        const input = CheckboxFactory.create()
        this.append(UIControllerLayout.createLabel(labelText), input[0])
        return this.terminator.with(input[1])
    }

    terminate(): void {
        this.terminator.terminate()
    }

    private append(label: HTMLLabelElement, element: HTMLElement): void {
        this.terminator.with({
            terminate: () => {
                label.remove()
                element.remove()
            }
        })
        this.container.append(label)
        this.container.append(element)
    }

    private static createLabel(labelText: string): HTMLLabelElement {
        const labelElement = document.createElement("label")
        labelElement.classList.add("name")
        labelElement.textContent = labelText
        return labelElement
    }
}