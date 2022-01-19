import { Random } from "./math.js";
export declare class Colors {
    static hslToRgb(h?: number, s?: number, l?: number): number;
    static getRandomPalette(random: Random): number[];
    private static PALETTES;
}
