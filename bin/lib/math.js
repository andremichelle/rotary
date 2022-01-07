export class JsRandom {
    constructor() {
    }
    nextDouble(min, max) {
        return min + Math.random() * (max - min);
    }
}
JsRandom.Instance = new JsRandom();
export class Mulberry32 {
    constructor(seed) {
        this.seed = seed;
    }
    nextDouble(min, max) {
        return min + this.uniform() * (max - min);
    }
    uniform() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296.0;
    }
}
export class SmoothStep {
    static fx(x) {
        return x * x * (3.0 - 2.0 * x);
    }
    static edge(edge0, edge1, x) {
        console.assert(0.0 <= edge0 && 1.0 >= edge0, `edge0(${edge0}) must be between 0 and 1`);
        console.assert(0.0 <= edge1 && 1.0 >= edge1, `edge1(${edge1}) must be between 0 and 1`);
        console.assert(edge0 !== edge1, `edge0(${edge0}) must not be equal to edge1(${edge1})`);
        return SmoothStep.fx(Math.min(1.0, Math.max(0.0, (x - edge0) / (edge1 - edge0))));
    }
}
//# sourceMappingURL=math.js.map