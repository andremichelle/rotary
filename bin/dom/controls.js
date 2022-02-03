import { Checkbox, NumericInput, NumericStepperInput, SelectInput } from "./inputs.js";
import { Terminator } from "../lib/common.js";
class NumericInputFactory {
    constructor() {
        this.template = new DOMParser().parseFromString(`
                    <input type="text">`, "text/html")
            .body.querySelectorAll("input").item(0);
    }
    static create(printMapping) {
        const htmlElement = NumericInputFactory.createElement();
        return [htmlElement, new NumericInput(htmlElement, printMapping)];
    }
    static createElement() {
        return NumericInputFactory.instance.template.cloneNode(true);
    }
}
NumericInputFactory.instance = new NumericInputFactory();
class NumericStepperInputFactory {
    constructor() {
    }
    static create(printMapping, stepper) {
        const htmlElement = NumericStepperInputFactory.createElement();
        return [htmlElement, new NumericStepperInput(htmlElement, printMapping, stepper)];
    }
    static createElement() {
        return NumericStepperInputFactory.template.cloneNode(true);
    }
}
NumericStepperInputFactory.template = new DOMParser().parseFromString(`
                    <fieldset class="stepper">
                        <button>◀︎</button>
                        <input type="text">
                        <button>▶</button>
                    </fieldset>`, "text/html")
    .body.querySelectorAll("fieldset").item(0);
class SelectInputFactory {
    constructor() {
        this.template = new DOMParser().parseFromString(`<select></select>`, "text/html")
            .body.querySelectorAll("select").item(0);
    }
    static create(map) {
        const htmlElement = SelectInputFactory.createElement();
        return [htmlElement, new SelectInput(htmlElement, map)];
    }
    static createElement() {
        return SelectInputFactory.instance.template.cloneNode(true);
    }
}
SelectInputFactory.instance = new SelectInputFactory();
class CheckboxFactory {
    constructor() {
        this.template = new DOMParser().parseFromString(`
            <label class="checkbox slider">
                <input type="checkbox"/>
                <span></span>
            </label>
          `, "text/html")
            .body.querySelectorAll("label").item(0);
    }
    static create() {
        const htmlElement = CheckboxFactory.createElement();
        return [htmlElement, new Checkbox(htmlElement.querySelector("input"))];
    }
    static createElement() {
        return CheckboxFactory.instance.template.cloneNode(true);
    }
}
CheckboxFactory.instance = new CheckboxFactory();
export class UIControllerLayout {
    constructor(container) {
        this.container = container;
        this.terminator = new Terminator();
        if (container === undefined) {
            this.container = document.createElement("div");
            this.container.classList.add("two-columns");
        }
        else {
            console.assert(this.container.classList.contains("two-columns"));
        }
    }
    element() {
        return this.container;
    }
    createNumericStepper(labelText, printMapping, stepper) {
        const input = NumericStepperInputFactory.create(printMapping, stepper);
        this.append(UIControllerLayout.createLabel(labelText), input[0]);
        return this.terminator.with(input[1]);
    }
    createNumericInput(labelText, printMapping) {
        const input = NumericInputFactory.create(printMapping);
        this.append(UIControllerLayout.createLabel(labelText), input[0]);
        return this.terminator.with(input[1]);
    }
    createSelect(labelText, map) {
        const input = SelectInputFactory.create(map);
        this.append(UIControllerLayout.createLabel(labelText), input[0]);
        return this.terminator.with(input[1]);
    }
    createCheckbox(labelText) {
        const input = CheckboxFactory.create();
        this.append(UIControllerLayout.createLabel(labelText), input[0]);
        return this.terminator.with(input[1]);
    }
    terminate() {
        this.terminator.terminate();
    }
    append(label, element) {
        this.terminator.with({
            terminate: () => {
                label.remove();
                element.remove();
            }
        });
        this.container.append(label);
        this.container.append(element);
    }
    static createLabel(labelText) {
        const labelElement = document.createElement("label");
        labelElement.classList.add("name");
        labelElement.textContent = labelText;
        return labelElement;
    }
}
//# sourceMappingURL=controls.js.map