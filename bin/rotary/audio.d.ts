import { RotaryModel } from "./model.js";
import { Random } from "../lib/math.js";
export declare type BuildAudio = (setup: Setup) => Promise<void>;
export interface Setup {
    context: AudioContext;
    output: AudioNode;
    model: RotaryModel;
    random: Random;
    loadInfo: (text: string) => void;
}
