export class Random {
    nextDouble(min, max) {
        return min + this.uniform() * (max - min);
    }
    nextInt(min, max) {
        return min + Math.floor(this.uniform() * (max - min));
    }
    nextElement(array) {
        return array[Math.floor(this.uniform() * array.length)];
    }
    nextBoolean() {
        return this.uniform() < 0.5;
    }
}
export class JsRandom extends Random {
    constructor() {
        super();
    }
    uniform() {
        return Math.random();
    }
}
JsRandom.Instance = new JsRandom();
export class Mulberry32 extends Random {
    constructor(seed = 0x12345678) {
        super();
        this.seed = seed | 0;
    }
    uniform() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296.0;
    }
}
export class Func {
    static smoothStep(x) {
        return x * x * (3.0 - 2.0 * x);
    }
    static clamp(x) {
        return Math.max(0.0, Math.min(1.0, x));
    }
    static mod(x) {
        return x - Math.floor(x);
    }
    static switchSign(x, neg) {
        return neg ? -x : +x;
    }
    static tx(x, t) {
        console.assert(0.0 <= x && x <= 1.0, `${x} out of bounds`);
        if (t === 0.0)
            return x;
        t *= 1.0 - 1e-3;
        return t < 0.0 ? (t * x + x) / (t * x + 1.0) : x / (t * x - t + 1.0);
    }
    static step(edge0, edge1, x) {
        return Math.min(1.0, Math.max(0.0, (x - edge0) / (edge1 - edge0)));
    }
    static stairsMap(fx, x, fragment = 1.0, frequency = 1.0) {
        const mx = fragment * x;
        const nx = Math.floor(mx);
        return frequency * (fx(mx - nx) + nx) / fragment;
    }
    static stairsInverse(fx, x, fragment = 1.0, frequency = 1.0) {
        const mx = fragment * x / frequency;
        const nx = Math.floor(mx);
        return (fx(mx - nx) + nx) / fragment;
    }
}
//# sourceMappingURL=math.js.map