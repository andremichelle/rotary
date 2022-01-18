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
    constructor() {
        this.layer = document.createElement("div");
        this.progress = document.createElement("progress");
        this.onProgress = (progress) => {
            this.progress.value = progress;
        };
        this.layer.style.width = "100%";
        this.layer.style.height = "100%";
        this.layer.style.position = "absolute";
        this.layer.style.pointerEvents = "all";
        this.layer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        this.layer.style.display = "flex";
        this.layer.style.alignItems = "center";
        this.layer.style.justifyContent = "center";
        this.layer.appendChild(this.progress);
        this.progress.max = 1.0;
        document.body.appendChild(this.layer);
    }
    completeWith(promise) {
        return promise.then(() => {
            this.layer.remove();
            return promise;
        });
    }
    complete() {
        this.layer.remove();
    }
}
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