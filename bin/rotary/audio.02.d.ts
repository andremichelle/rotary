import { RotaryModel } from "./model.js";
import { Random } from "../lib/math.js";
export declare const buildAudio: (context: AudioContext, output: AudioNode, model: RotaryModel, random: Random) => Promise<void>;
