import { Estimation } from "../lib/common.js";
export const getChromeVersion = () => {
    const raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
    return raw ? parseInt(raw[2], 10) : false;
};
export class Updater {
    constructor(callback) {
        this.callback = callback;
        this.needsUpdate = false;
        this.updater = () => {
            this.needsUpdate = false;
            this.callback();
        };
    }
    requestUpdate() {
        if (!this.needsUpdate) {
            this.needsUpdate = true;
            requestAnimationFrame(this.updater);
        }
    }
}
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
export class ProgressIndicator {
    constructor(title) {
        this.layer = document.createElement("div");
        this.title = document.createElement("h3");
        this.label = document.createElement("label");
        this.progress = document.createElement("progress");
        this.cancel = document.createElement("span");
        this.estimation = new Estimation();
        this.onProgress = (progress) => {
            this.label.textContent = this.estimation.update(progress);
            this.progress.value = progress;
        };
        this.layer.style.width = "100%";
        this.layer.style.height = "100%";
        this.layer.style.position = "absolute";
        this.layer.style.pointerEvents = "all";
        this.layer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        this.layer.style.display = "flex";
        this.layer.style.flexDirection = "column";
        this.layer.style.alignItems = "center";
        this.layer.style.justifyContent = "center";
        this.label.style.fontSize = "11px";
        this.label.style.color = "rgba(255, 255, 255, 0.7)";
        this.progress.style.width = "180px";
        this.progress.style.height = "21px";
        this.progress.max = 1.0;
        if (undefined !== title) {
            this.title.textContent = title;
            this.layer.appendChild(this.title);
        }
        this.layer.appendChild(this.label);
        this.layer.appendChild(this.progress);
        document.body.appendChild(this.layer);
    }
    onCancel(onCancel) {
        console.assert(null === this.cancel.parentElement, "Cannot assign twice");
        this.layer.appendChild(this.cancel);
        this.cancel.textContent = "cancel";
        this.cancel.style.cursor = "pointer";
        this.cancel.style.color = "rgba(255, 255, 255, 0.5)";
        this.cancel.onclick = () => {
            this.complete();
            onCancel();
        };
    }
    completeWith(promise) {
        return promise.then(() => {
            this.complete();
            return promise;
        });
    }
    complete() {
        if (null !== this.layer.parentElement) {
            this.layer.remove();
        }
    }
}
//# sourceMappingURL=common.js.map