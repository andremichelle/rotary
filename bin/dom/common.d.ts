import { ObservableValue, Terminable } from "../lib/common.js";
export declare class Dom {
    static bindEventListener(target: EventTarget, type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): Terminable;
    static insertElement(parent: Element, child: Element, index?: number): void;
    static emptyNode(node: Node): void;
    static configRepeatButton(button: any, callback: any): Terminable;
}
export declare type Parser<Y> = (text: string) => Y | null;
export declare type Printer<Y> = (value: Y) => string;
export declare class PrintMapping<Y> {
    private readonly parser;
    private readonly printer;
    private readonly preUnit;
    private readonly postUnit;
    static UnipolarPercent: PrintMapping<number>;
    static RGB: PrintMapping<number>;
    static integer(postUnit: string): PrintMapping<number>;
    static float(numPrecision: number, preUnit: string, postUnit: string): PrintMapping<number>;
    constructor(parser: Parser<Y>, printer: Printer<Y>, preUnit?: string, postUnit?: string);
    parse(text: string): Y | null;
    print(value: Y): string;
}
export interface Stepper {
    decrease(value: ObservableValue<number>): void;
    increase(value: ObservableValue<number>): void;
}
export declare class NumericStepper implements Stepper {
    private readonly step;
    static Integer: NumericStepper;
    static Hundredth: NumericStepper;
    constructor(step?: number);
    decrease(value: ObservableValue<number>): void;
    increase(value: ObservableValue<number>): void;
}
export declare class Color {
    static hslToRgb(h?: number, s?: number, l?: number): number;
}
