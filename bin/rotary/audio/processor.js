import { Edge, RotaryModel } from "../model.js";
import { FormatUpdatedMessage, UpdateCursorMessage } from "./messages-to-worklet.js";
import { barsToNumFrames, numFramesToBars, RENDER_QUANTUM } from "../../audio/common.js";
import { ObservableValueImpl } from "../../lib/common.js";
import { TransportMessageType } from "../../audio/sequencing.js";
class Voice {
    constructor(delayFrames, output, sampleKey, position = 0 | 0) {
        this.delayFrames = delayFrames;
        this.output = output;
        this.sampleKey = sampleKey;
        this.position = position;
        this.duration = Number.MAX_SAFE_INTEGER;
    }
    stop() {
        if (this.duration > Voice.RELEASE) {
            this.duration = Voice.RELEASE;
        }
    }
}
Voice.ATTACK = (0.010 * sampleRate) | 0;
Voice.RELEASE = (0.050 * sampleRate) | 0;
class Sample {
    constructor(frames, loop) {
        this.frames = frames;
        this.loop = loop;
    }
}
registerProcessor("rotary", class extends AudioWorkletProcessor {
    constructor() {
        super();
        this.model = new RotaryModel();
        this.samples = new Map();
        this.activeVoices = new Map();
        this.transport = new ObservableValueImpl(false);
        this.updateCount = 0 | 0;
        this.maxKey = 0 | 0;
        this.barPosition = +0.0;
        const fps = 60.0;
        this.updateRate = (sampleRate / fps) | 0;
        this.port.onmessage = (event) => {
            const msg = event.data;
            if (msg.type === "format") {
                this.model.deserialize(msg.format);
                this.port.postMessage(new FormatUpdatedMessage(msg.version));
            }
            else if (msg.type === "sample") {
                this.samples.set(msg.key, new Sample(msg.sample, msg.loop));
                this.maxKey = Math.max(msg.key, this.maxKey);
            }
            else if (msg.type === TransportMessageType.Play) {
                this.transport.set(true);
            }
            else if (msg.type === TransportMessageType.Pause) {
                this.transport.set(false);
                this.activeVoices.forEach(voices => voices.forEach(voice => voice.stop()));
            }
            else if (msg.type === TransportMessageType.Move) {
                this.barPosition = msg.position;
                this.transport.set(false);
            }
        };
        for (let index = 0; index < RotaryModel.MAX_TRACKS; index++) {
            this.activeVoices.set(index, []);
        }
    }
    process(inputs, outputs) {
        if (this.transport.get()) {
            this.schedule();
        }
        for (let index = 0; index < RotaryModel.MAX_TRACKS; index++) {
            const voices = this.activeVoices.get(index);
            for (let voiceIndex = voices.length - 1; 0 <= voiceIndex; voiceIndex--) {
                const voice = voices[voiceIndex];
                const sample = this.samples.get(voice.sampleKey);
                if (sample === undefined)
                    continue;
                const frames = sample.frames;
                const output = outputs[voice.output];
                const outL = output[0];
                const outR = output[1];
                for (let frameIndex = 0; frameIndex < RENDER_QUANTUM; frameIndex++) {
                    if (0 <= voice.delayFrames) {
                        const position = voice.position++;
                        const duration = voice.duration--;
                        const numFrames = frames[0].length;
                        const complete = 0 === duration || (!sample.loop && position >= numFrames);
                        if (complete) {
                            voices.splice(voiceIndex, 1);
                            break;
                        }
                        else {
                            const envelope = Math.min(1.0, duration / Voice.RELEASE) * Math.min(1.0, position / Voice.ATTACK);
                            if (sample.loop) {
                                outL[frameIndex] += frames[0][position % numFrames] * envelope;
                                outR[frameIndex] += frames[1][position % numFrames] * envelope;
                            }
                            else {
                                outL[frameIndex] += frames[0][position] * envelope;
                                outR[frameIndex] += frames[1][position] * envelope;
                            }
                        }
                    }
                    else {
                        voice.delayFrames++;
                    }
                }
            }
        }
        this.updateCount += RENDER_QUANTUM;
        if (this.updateCount >= this.updateRate) {
            this.updateCount -= this.updateRate;
            this.port.postMessage(new UpdateCursorMessage(this.barPosition));
        }
        return true;
    }
    schedule() {
        const tracks = this.model.tracks;
        const bpm = this.model.bpm.get();
        const p0 = this.barPosition;
        const p1 = p0 + numFramesToBars(RENDER_QUANTUM, bpm, sampleRate) / this.model.stretch.get();
        for (let trackIndex = 0; trackIndex < tracks.size(); trackIndex++) {
            const track = tracks.get(trackIndex);
            const t0 = track.globalToLocal(p0);
            const t1 = track.globalToLocal(p1);
            const iterator = track.querySections(t0, t1);
            while (iterator.hasNext()) {
                const result = iterator.next();
                const running = this.activeVoices.get(trackIndex);
                running.forEach(v => v.stop());
                if (result.edge === Edge.Start) {
                    let frameIndex = barsToNumFrames(track.localToGlobal(result.position) - p0, bpm, sampleRate) | 0;
                    if (0 > frameIndex || frameIndex >= RENDER_QUANTUM) {
                        if (Math.abs(t1 - t0) < 1e-10) {
                            console.warn(`clamp frameIndex(${frameIndex}) while abs(t1 - t0) = ${Math.abs(t1 - t0)} < 1e-10`);
                            frameIndex = 0 | 0;
                        }
                        else {
                            throw new Error(`frameIndex(${frameIndex}), 
                            t0: ${t0}, t1: ${t1}, t0*: ${t0 + 1e-7 - 1e-7}, t1*: ${t1 + 1e-7 - 1e-7}, 
                            td: ${t1 - t0}, p: ${result.position}, 
                                frameIndexAsNumber: ${(track.localToGlobal(result.position) - p0)}`);
                        }
                    }
                    const sampleKey = (trackIndex * track.segments.get() + result.index) % (this.maxKey + 1);
                    const voice = new Voice(-frameIndex, trackIndex, sampleKey, 0);
                    this.activeVoices.get(trackIndex).push(voice);
                }
            }
        }
        this.barPosition = p1;
    }
});
//# sourceMappingURL=processor.js.map