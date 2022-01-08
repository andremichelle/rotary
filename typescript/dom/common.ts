import {ObservableValue, Terminable} from "../lib/common.js"

export class Dom {
    static bindEventListener(target: EventTarget,
                             type: string, listener: EventListenerOrEventListenerObject,
                             options?: AddEventListenerOptions): Terminable {
        target.addEventListener(type, listener, options)
        return {terminate: () => target.removeEventListener(type, listener, options)}
    }

    static insertElement(parent: Element, child: Element, index: number = Number.MAX_SAFE_INTEGER): void {
        if (index >= parent.children.length) {
            parent.appendChild(child)
        } else {
            parent.insertBefore(child, parent.children[index])
        }
    }

    static emptyNode(node: Node): void {
        while (node.hasChildNodes()) {
            node.lastChild.remove()
        }
    }

    static configRepeatButton(button, callback): Terminable {
        const mouseDownListener = () => {
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
        }
        button.addEventListener("mousedown", mouseDownListener)
        return {terminate: () => button.removeEventListener("mousedown", mouseDownListener)}
    }
}

export type Parser<Y> = (text: string) => Y | null
export type Printer<Y> = (value: Y) => string

export class PrintMapping<Y> {
    static UnipolarPercent = new PrintMapping(text => {
        const value = parseFloat(text)
        if (isNaN(value)) return null
        return value / 100.0
    }, value => (value * 100.0).toFixed(1), "", "%")
    static RGB = new PrintMapping<number>(text => {
        if (3 === text.length) {
            text = text.charAt(0) + text.charAt(0) + text.charAt(1) + text.charAt(1) + text.charAt(2) + text.charAt(2)
        }
        if (6 === text.length) {
            return parseInt(text, 16)
        } else {
            return null
        }
    }, value => value.toString(16).padStart(6, "0").toUpperCase(), "#", "")

    static integer(postUnit: string): PrintMapping<number> {
        return new PrintMapping(text => {
            const value = parseInt(text, 10)
            if (isNaN(value)) return null
            return value | 0
        }, value => String(value), "", postUnit)
    }

    static float(numPrecision: number, preUnit: string, postUnit: string): PrintMapping<number> {
        return new PrintMapping(text => {
            const value = parseFloat(text)
            if (isNaN(value)) return null
            return value | 0
        }, value => value.toFixed(numPrecision), preUnit, postUnit)
    }

    constructor(private readonly parser: Parser<Y>,
                private readonly printer: Printer<Y>,
                private readonly preUnit = "",
                private readonly postUnit = "") {
    }

    parse(text: string): Y | null {
        return this.parser(text.replace(this.preUnit, "").replace(this.postUnit, ""))
    }

    print(value: Y): string {
        return undefined === value ? "" : `${this.preUnit}${this.printer(value)}${this.postUnit}`
    }
}

export interface Stepper {
    decrease(value: ObservableValue<number>): void

    increase(value: ObservableValue<number>): void
}

export class NumericStepper implements Stepper {
    static Integer = new NumericStepper(1)
    static Hundredth = new NumericStepper(0.01)

    constructor(private readonly step: number = 1) {
    }

    decrease(value: ObservableValue<number>): void {
        value.set(Math.round((value.get() - this.step) / this.step) * this.step)
    }

    increase(value: ObservableValue<number>): void {
        value.set(Math.round((value.get() + this.step) / this.step) * this.step)
    }
}

export class Color {
    /**
     * Converts an HSL color value to RGB. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     * Assumes h, s, and l are contained in the set [0, 1] and
     * returns rgb
     */
    static hslToRgb(h: number = 1.0, s: number = 1.0, l: number = 0.5): number {
        let r: number, g: number, b: number
        if (s == 0) {
            r = g = b = Math.round(l * 255) // achromatic
        } else {
            const hue2rgb = (p: number, q: number, t: number): number => {
                if (t < 0.0) t += 1.0
                if (t > 1.0) t -= 1.0
                if (t < 1 / 6) return p + (q - p) * 6.0 * t
                if (t < 1 / 2) return q
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6.0
                return p
            }
            const q = l < 0.5 ? l * (1.0 + s) : l + s - l * s
            const p = 2.0 * l - q
            r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255)
            g = Math.round(hue2rgb(p, q, h) * 255)
            b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
        }
        return (r << 16) | (g << 8) | b
    }
}