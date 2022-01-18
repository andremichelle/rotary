export class Window {
    static generate(type, n = 512 | 0) {
        const values = new Float32Array(n);
        switch (type) {
            case Window.Shape.Bartlett: {
                const n2 = (n >> 1) - 1;
                let i = 0;
                for (; i <= n2; ++i) {
                    values[i] = 2.0 * i / (n - 1.0);
                }
                for (; i < n; ++i) {
                    values[i] = 2.0 - 2.0 * i / (n - 1.0);
                }
                return values;
            }
            case Window.Shape.Blackman: {
                const a = Math.PI / (n - 1);
                const c = 2.0 * a;
                const d = 4.0 * a;
                for (let i = 0; i < n; ++i) {
                    values[i] = 0.42323 - 0.49755 * Math.cos(c * i) + 0.07922 * Math.cos(d * i);
                }
                return values;
            }
            case Window.Shape.BlackmanHarris: {
                const a = Math.PI / (n - 1);
                const c = 2.0 * a;
                const d = 4.0 * a;
                const e = 6.0 * a;
                for (let i = 0; i < n; ++i) {
                    values[i] = 0.35875 - 0.48829 * Math.cos(c * i) + 0.14128 * Math.cos(d * i) - 0.01168 * Math.cos(e * i);
                }
                return values;
            }
            case Window.Shape.Hamming: {
                const a = Math.PI / (n - 1);
                const c = 2.0 * a;
                for (let i = 0; i < n; ++i) {
                    values[i] = 0.54 - 0.46 * Math.cos(c * i);
                }
                return values;
            }
            case Window.Shape.Hanning: {
                const a = Math.PI / (n - 1);
                const c = 2.0 * a;
                for (let i = 0; i < n; ++i) {
                    values[i] = 0.5 - 0.5 * Math.cos(c * i);
                }
                return values;
            }
            default:
                throw new Error("Unknown type: " + type);
        }
    }
}
(function (Window) {
    let Shape;
    (function (Shape) {
        Shape[Shape["Bartlett"] = 0] = "Bartlett";
        Shape[Shape["Blackman"] = 1] = "Blackman";
        Shape[Shape["BlackmanHarris"] = 2] = "BlackmanHarris";
        Shape[Shape["Hamming"] = 3] = "Hamming";
        Shape[Shape["Hanning"] = 4] = "Hanning";
    })(Shape = Window.Shape || (Window.Shape = {}));
})(Window || (Window = {}));
//# sourceMappingURL=window.js.map