import { RotaryModel } from "../model/rotary.js";
export class Voice {
    constructor(startFrame, trackIndex, segmentIndex, track) {
        this.startFrame = startFrame;
        this.trackIndex = trackIndex;
        this.segmentIndex = segmentIndex;
        this.track = track;
    }
}
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
    process(outputs, positions) {
        for (let index = 0; index < RotaryModel.MAX_TRACKS; index++) {
            const voices = this.voices.get(index);
            for (let voiceIndex = voices.length - 1; 0 <= voiceIndex; voiceIndex--) {
                const voice = voices[voiceIndex];
                const complete = voice.process(outputs, positions);
                if (complete) {
                    voices.splice(voiceIndex, 1);
                }
            }
        }
    }
}
//# sourceMappingURL=voices.js.map