import { RotaryModel } from "./model.js";
import { Audio } from "./audio.js";
export declare const open: (model: RotaryModel) => Promise<void>;
export declare const save: (model: RotaryModel) => Promise<void>;
export declare const renderWebM: (model: RotaryModel) => Promise<void>;
export declare const renderGIF: (model: RotaryModel) => Promise<void>;
export declare const renderWav: (audio: Audio) => Promise<void>;
export declare const renderVideo: (model: RotaryModel) => Promise<void>;
