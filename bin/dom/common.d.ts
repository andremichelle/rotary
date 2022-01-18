import { Terminable } from "../lib/common.js";
export declare class Dom {
    static bindEventListener(target: EventTarget, type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): Terminable;
    static insertElement(parent: Element, child: Element, index?: number): void;
    static replaceElement(newChild: HTMLElement, oldChild: HTMLElement): void;
    static emptyNode(node: Node): void;
    static configRepeatButton(button: any, callback: any): Terminable;
}
export declare class ProgressIndicator {
    private readonly layer;
    private readonly title;
    private readonly label;
    private readonly progress;
    private readonly cancel;
    private readonly estimation;
    constructor(title?: string);
    onCancel(onCancel: () => void): void;
    onProgress: (progress: number) => void;
    completeWith<T>(promise: Promise<T>): Promise<T>;
    complete(): void;
}
export declare class Color {
    static hslToRgb(h?: number, s?: number, l?: number): number;
}
