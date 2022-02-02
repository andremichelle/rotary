import { NumericInput, NumericStepperInput, SelectInput } from "./inputs.js";
export class TwoColumnBuilder {
    constructor() {
        this.container = document.createElement("div");
        this.container.classList.add("two-columns");
    }
    element() {
        return this.container;
    }
    createStepper(labelText, printMapping, stepper) {
        const html = new DOMParser().parseFromString(`
                    <label class="name">${labelText}</label>
                    <fieldset class="stepper">
                        <button>◀︎</button>
                        <input type="text">
                        <button>▶</button>
                    </fieldset>`, "text/html")
            .body.querySelectorAll("*");
        const label = html.item(0);
        const fieldset = html.item(1);
        this.container.append(label);
        this.container.append(fieldset);
        return new NumericStepperInput(fieldset, printMapping, stepper);
    }
    createNumericInput(labelText, printMapping) {
        const html = new DOMParser().parseFromString(`
                    <label class="name">${labelText}</label>
                    <input type="text" value="">`, "text/html")
            .body.querySelectorAll("*");
        const label = html.item(0);
        const input = html.item(1);
        this.container.append(label);
        this.container.append(input);
        return new NumericInput(input, printMapping);
    }
    createSelect(labelText, map) {
        const html = new DOMParser().parseFromString(`
                    <label class="name">${labelText}</label>
                    <select></select>`, "text/html")
            .body.querySelectorAll("*");
        const label = html.item(0);
        const select = html.item(1);
        this.container.append(label);
        this.container.append(select);
        return new SelectInput(select, map);
    }
}
//# sourceMappingURL=controls.js.map