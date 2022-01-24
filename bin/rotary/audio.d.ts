import { RotaryModel } from "./model.js";
import { Random } from "../lib/math.js";
export declare type BuildAudio = (setup: Setup) => Promise<void>;
export interface Setup {
    loadInfo: (text: string) => void;
    context: AudioContext;
    output: AudioNode;
    model: RotaryModel;
    random: Random;
}
