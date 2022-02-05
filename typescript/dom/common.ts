import {Estimation, Terminable} from "../lib/common.js"

export const getChromeVersion = (): boolean | number => {
    const raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)
    return raw ? parseInt(raw[2], 10) : false
}

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

    static replaceElement(newChild: HTMLElement, oldChild: HTMLElement): void {
        oldChild.parentNode.replaceChild(newChild, oldChild)
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

export class ProgressIndicator {
    private readonly layer: HTMLDivElement = document.createElement("div")
    private readonly title: HTMLHeadingElement = document.createElement("h3")
    private readonly label: HTMLLabelElement = document.createElement("label")
    private readonly progress: HTMLProgressElement = document.createElement("progress")
    private readonly cancel: HTMLSpanElement = document.createElement("span")
    private readonly estimation: Estimation = new Estimation()

    constructor(title?: string) {
        this.layer.style.width = "100%"
        this.layer.style.height = "100%"
        this.layer.style.position = "absolute"
        this.layer.style.pointerEvents = "all"
        this.layer.style.backgroundColor = "rgba(0, 0, 0, 0.8)"
        this.layer.style.display = "flex"
        this.layer.style.flexDirection = "column"
        this.layer.style.alignItems = "center"
        this.layer.style.justifyContent = "center"
        this.label.style.fontSize = "11px"
        this.label.style.color = "rgba(255, 255, 255, 0.7)"
        this.progress.style.width = "180px"
        this.progress.style.height = "21px"
        this.progress.max = 1.0
        if (undefined !== title) {
            this.title.textContent = title
            this.layer.appendChild(this.title)
        }
        this.layer.appendChild(this.label)
        this.layer.appendChild(this.progress)
        document.body.appendChild(this.layer)
    }

    onCancel(onCancel: () => void): void {
        console.assert(null === this.cancel.parentElement, "Cannot assign twice")
        this.layer.appendChild(this.cancel)
        this.cancel.textContent = "cancel"
        this.cancel.style.cursor = "pointer"
        this.cancel.style.color = "rgba(255, 255, 255, 0.5)"
        this.cancel.onclick = () => {
            this.complete()
            onCancel()
        }
    }

    onProgress = (progress: number): void => {
        this.label.textContent = this.estimation.update(progress)
        this.progress.value = progress
    }

    completeWith<T>(promise: Promise<T>): Promise<T> {
        return promise.then(() => {
            this.complete()
            return promise
        })
    }

    complete() {
        if (null !== this.layer.parentElement) {
            this.layer.remove()
        }
    }
}