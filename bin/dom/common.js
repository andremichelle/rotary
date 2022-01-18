export class Dom {
    static bindEventListener(target, type, listener, options) {
        target.addEventListener(type, listener, options);
        return { terminate: () => target.removeEventListener(type, listener, options) };
    }
    static insertElement(parent, child, index = Number.MAX_SAFE_INTEGER) {
        if (index >= parent.children.length) {
            parent.appendChild(child);
        }
        else {
            parent.insertBefore(child, parent.children[index]);
        }
    }
    static replaceElement(newChild, oldChild) {
        oldChild.parentNode.replaceChild(newChild, oldChild);
    }
    static emptyNode(node) {
        while (node.hasChildNodes()) {
            node.lastChild.remove();
        }
    }
    static configRepeatButton(button, callback) {
        const mouseDownListener = () => {
            let lastTime = Date.now();
            let delay = 500.0;
            const repeat = () => {
                if (!isNaN(lastTime)) {
                    if (Date.now() - lastTime > delay) {
                        lastTime = Date.now();
                        delay *= 0.75;
                        callback();
                    }
                    requestAnimationFrame(repeat);
                }
            };
            requestAnimationFrame(repeat);
            callback();
            window.addEventListener("mouseup", () => {
                lastTime = NaN;
                delay = Number.MAX_VALUE;
            }, { once: true });
        };
        button.addEventListener("mousedown", mouseDownListener);
        return { terminate: () => button.removeEventListener("mousedown", mouseDownListener) };
    }
}
export class PrintMapping {
    constructor(parser, printer, preUnit = "", postUnit = "") {
        this.parser = parser;
        this.printer = printer;
        this.preUnit = preUnit;
        this.postUnit = postUnit;
    }
    static integer(postUnit) {
        return new PrintMapping(text => {
            const value = parseInt(text, 10);
            if (isNaN(value))
                return null;
            return Math.round(value) | 0;
        }, value => String(value), "", postUnit);
    }
    static float(numPrecision, preUnit, postUnit) {
        return new PrintMapping(text => {
            const value = parseFloat(text);
            if (isNaN(value))
                return null;
            return value;
        }, value => value.toFixed(numPrecision), preUnit, postUnit);
    }
    parse(text) {
        return this.parser(text.replace(this.preUnit, "").replace(this.postUnit, ""));
    }
    print(value) {
        return undefined === value ? "" : `${this.preUnit}${this.printer(value)}${this.postUnit}`;
    }
}
PrintMapping.UnipolarPercent = new PrintMapping(text => {
    const value = parseFloat(text);
    if (isNaN(value))
        return null;
    return value / 100.0;
}, value => (value * 100.0).toFixed(1), "", "%");
PrintMapping.RGB = new PrintMapping(text => {
    if (3 === text.length) {
        text = text.charAt(0) + text.charAt(0) + text.charAt(1) + text.charAt(1) + text.charAt(2) + text.charAt(2);
    }
    if (6 === text.length) {
        return parseInt(text, 16);
    }
    else {
        return null;
    }
}, value => value.toString(16).padStart(6, "0").toUpperCase(), "#", "");
export class NumericStepper {
    constructor(step = 1) {
        this.step = step;
    }
    decrease(value) {
        value.set(Math.round((value.get() - this.step) / this.step) * this.step);
    }
    increase(value) {
        value.set(Math.round((value.get() + this.step) / this.step) * this.step);
    }
}
NumericStepper.Integer = new NumericStepper(1);
NumericStepper.Hundredth = new NumericStepper(0.01);
export class Color {
    static hslToRgb(h = 1.0, s = 1.0, l = 0.5) {
        let r, g, b;
        if (s == 0) {
            r = g = b = Math.round(l * 255);
        }
        else {
            const hue2rgb = (p, q, t) => {
                if (t < 0.0)
                    t += 1.0;
                if (t > 1.0)
                    t -= 1.0;
                if (t < 1 / 6)
                    return p + (q - p) * 6.0 * t;
                if (t < 1 / 2)
                    return q;
                if (t < 2 / 3)
                    return p + (q - p) * (2 / 3 - t) * 6.0;
                return p;
            };
            const q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
            const p = 2.0 * l - q;
            r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
            g = Math.round(hue2rgb(p, q, h) * 255);
            b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
        }
        return (r << 16) | (g << 8) | b;
    }
}
//# sourceMappingURL=common.js.map