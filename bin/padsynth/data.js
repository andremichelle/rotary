export class Harmonic {
    constructor(position, level, bandWidth) {
        this.position = position;
        this.level = level;
        this.bandWidth = bandWidth;
    }
    static make(root, bandWidth = 0.5, bandWidthScale = 1.01, brightness = -0.5, distance = 1.0, numHarmonics = 64) {
        const result = [];
        for (let i = 0; i < numHarmonics; i++) {
            const position = i * distance + 1;
            const level = Math.pow(position, brightness);
            const bw = (Math.pow(2.0, bandWidth / 1200.0) - 1.0) * Math.pow(position, bandWidthScale);
            result[i] = new Harmonic(position * root, level, bw);
        }
        return result;
    }
}
export class InitMessage {
    constructor(fftSize) {
        this.fftSize = fftSize;
        this.type = 'init';
    }
}
export class CreateMessage {
    constructor(harmonics) {
        this.harmonics = harmonics;
        this.type = 'create';
    }
}
export class CreatedMessage {
    constructor(wavetable) {
        this.wavetable = wavetable;
        this.type = 'created';
    }
}
//# sourceMappingURL=data.js.map