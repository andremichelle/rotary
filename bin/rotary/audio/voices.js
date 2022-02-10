import { RotaryModel } from "../model.js";
export class VoiceManager {
    constructor() {
        this.voices = new Map();
        for (let index = 0; index < RotaryModel.MAX_TRACKS; index++) {
            this.voices.set(index, []);
        }
    }
    add(index, voice) {
        this.voices.get(index).push(voice);
    }
    stopAll() {
        this.voices.forEach(voices => voices.forEach(voice => voice.stop()));
    }
    stopByIndex(index) {
        this.voices.get(index).forEach(voice => voice.stop());
    }
    process(outputs) {
        for (let index = 0; index < RotaryModel.MAX_TRACKS; index++) {
            const voices = this.voices.get(index);
            for (let voiceIndex = voices.length - 1; 0 <= voiceIndex; voiceIndex--) {
                const voice = voices[voiceIndex];
                const complete = voice.process(outputs);
                if (complete) {
                    voices.splice(voiceIndex, 1);
                }
            }
        }
    }
}
//# sourceMappingURL=voices.js.map