import { Terminable } from "../lib/common.js";
export declare const getChromeVersion: () => number | boolean;
export declare class Updater {
    private readonly callback;
    private needsUpdate;
    constructor(callback: () => void);
    private updater;
    requestUpdate(): void;
}
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
