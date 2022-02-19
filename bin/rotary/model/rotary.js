import { CompositeSettings, ConvolverFiles, ConvolverSettings, FlangerSettings, PulsarDelaySettings } from "../../audio/composite.js";
import { ArrayUtils, BoundNumericValue, ObservableCollection, ObservableImpl, ObservableValueImpl, Terminator } from "../../lib/common.js";
import { Linear, LinearInteger } from "../../lib/mapping.js";
import { createRenderConfiguration } from "../render.js";
import { Colors } from "../../lib/colors.js";
import { barsToSeconds } from "../../audio/common.js";
import { RotaryTrackModel } from "./track.js";
export class RotaryExportSetting {
    constructor() {
        this.terminator = new Terminator();
        this.size = this.terminator.with(new BoundNumericValue(new LinearInteger(128, 2048), 256));
        this.fps = this.terminator.with(new BoundNumericValue(new LinearInteger(12, 120), 60));
        this.subFrames = this.terminator.with(new BoundNumericValue(new LinearInteger(1, 64), 16));
    }
    deserialize(format) {
        this.size.set(format.size);
        this.fps.set(format.fps);
        this.subFrames.set(format.subFrames);
        return this;
    }
    serialize() {
        return { fps: this.fps.get(), subFrames: this.subFrames.get(), size: this.size.get() };
    }
    getConfiguration(numFrames) {
        return createRenderConfiguration({
            size: this.size.get(),
            motionFrames: this.subFrames.get(),
            fps: this.fps.get(),
            numFrames: numFrames
        });
    }
    terminate() {
        this.terminator.terminate();
    }
}
const convolverSettingsA = new ConvolverSettings();
const convolverSettingsB = new ConvolverSettings();
const paths = Array.from(ConvolverFiles.values());
convolverSettingsA.url.set(paths[1]);
convolverSettingsB.url.set(paths[3]);
export class RotaryModel {
    constructor() {
        this.terminator = new Terminator();
        this.observable = new ObservableImpl();
        this.tracks = new ObservableCollection();
        this.exportSettings = this.terminator.with(new RotaryExportSetting());
        this.radiusMin = this.bindValue(new BoundNumericValue(new LinearInteger(0, 1024), 20));
        this.phaseOffset = this.bindValue(new BoundNumericValue(Linear.Identity, 0.75));
        this.inactiveAlpha = this.bindValue(new BoundNumericValue(Linear.Identity, 0.1));
        this.bpm = this.bindValue(new BoundNumericValue(new Linear(30.0, 999.0), 120.0));
        this.stretch = this.bindValue(new BoundNumericValue(new Linear(1.0, 16.0), 4.0));
        this.motion = this.bindValue(new BoundNumericValue(new LinearInteger(1, 32), 8));
        this.aux = [
            new ObservableValueImpl(new PulsarDelaySettings()),
            new ObservableValueImpl(convolverSettingsA),
            new ObservableValueImpl(new FlangerSettings()),
            new ObservableValueImpl(convolverSettingsB)
        ];
        const notify = () => this.observable.notify(this);
        ObservableCollection.observeNested(this.tracks, notify);
        const auxTerminators = ArrayUtils.fill(this.aux.length, () => this.terminator.with(new Terminator()));
        this.aux.forEach((value, index) => {
            this.terminator.with(value.addObserver((compositeSettings) => {
                auxTerminators[index].terminate();
                auxTerminators[index].with(compositeSettings.addObserver(notify));
            }, false));
        });
    }
    addObserver(observer, notify) {
        if (notify)
            observer(this);
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    randomize(random) {
        this.radiusMin.set(20);
        this.tracks.clear();
        const palette = Colors.getRandomPalette(random);
        let radius = this.radiusMin.get();
        while (radius < 256) {
            const track = this.createTrack().randomize(random);
            track.rgb.set(palette[Math.floor(random.nextDouble(0.0, palette.length))]);
            radius += track.width.get() + track.widthPadding.get();
        }
        return this;
    }
    randomizeTracks(random) {
        this.tracks.forEach(track => track.randomize(random));
        return this;
    }
    randomizePalette(random) {
        const palette = Colors.getRandomPalette(random);
        this.tracks.forEach(track => track.rgb.set(palette[Math.floor(random.nextDouble(0.0, palette.length))]));
        return this;
    }
    test() {
        this.tracks.clear();
        this.radiusMin.set(160);
        this.phaseOffset.set(0.0);
        this.createTrack().test();
        return this;
    }
    createTrack(index = Number.MAX_SAFE_INTEGER) {
        const track = new RotaryTrackModel(this);
        return this.tracks.add(track, index) ? track : null;
    }
    copyTrack(source, insertIndex = Number.MAX_SAFE_INTEGER) {
        const copy = this.createTrack(insertIndex);
        copy.segments.set(source.segments.get());
        copy.fill.set(source.fill.get());
        copy.rgb.set(source.rgb.get());
        copy.length.set(source.length.get());
        copy.lengthRatio.set(source.lengthRatio.get());
        copy.outline.set(source.outline.get());
        copy.width.set(source.width.get());
        copy.widthPadding.set(source.widthPadding.get());
        copy.motion.set(source.motion.get().copy());
        copy.bend.set(source.bend.get());
        copy.phaseOffset.set(source.phaseOffset.get());
        copy.frequency.set(source.frequency.get());
        copy.reverse.set(source.reverse.get());
        copy.gain.set(source.gain.get());
        copy.volume.set(source.volume.get());
        copy.panning.set(source.panning.get());
        copy.aux.forEach((value, index) => value.set(source.aux[index].get()));
        copy.mute.set(source.mute.get());
        copy.solo.set(source.solo.get());
        return copy;
    }
    removeTrack(track) {
        return this.tracks.remove(track);
    }
    duration() {
        return barsToSeconds(this.stretch.get(), this.bpm.get());
    }
    clear() {
        this.radiusMin.set(20.0);
        this.tracks.clear();
    }
    measureRadius() {
        const lastIndex = this.tracks.size() - 1;
        return this.tracks.reduce((radius, track, index) => radius + track.width.get() + (lastIndex !== index ? track.widthPadding.get() : 0)
            * Math.min(1.0, (this.tracks.size() - index - 1)), this.radiusMin.get());
    }
    intersects(phase) {
        for (let i = 0; i < this.tracks.size(); i++) {
            const trackModel = this.tracks.get(i);
            const crossing = trackModel.localToSegment(trackModel.globalToLocal(phase));
            if (crossing !== null && !trackModel.exclude.getBit(crossing.index)) {
                return true;
            }
        }
        return false;
    }
    terminate() {
        this.terminator.terminate();
    }
    serialize() {
        return {
            radiusMin: this.radiusMin.get(),
            exportSettings: this.exportSettings.serialize(),
            phaseOffset: this.phaseOffset.get(),
            bpm: this.bpm.get(),
            stretch: this.stretch.get(),
            tracks: this.tracks.map(track => track.serialize()),
            aux: this.aux.map((value) => value.get().serialize())
        };
    }
    deserialize(format) {
        this.radiusMin.set(format.radiusMin);
        this.exportSettings.deserialize(format.exportSettings);
        this.phaseOffset.set(format.phaseOffset);
        this.bpm.set(format.bpm);
        this.stretch.set(format.stretch);
        this.tracks.clear();
        this.tracks.addAll(format.tracks.map(trackFormat => new RotaryTrackModel(this).deserialize(trackFormat)));
        this.aux.forEach((value, index) => value.set(CompositeSettings.from(format.aux[index])));
        return this;
    }
    bindValue(property) {
        this.terminator.with(property.addObserver(() => this.observable.notify(this), false));
        return this.terminator.with(property);
    }
}
RotaryModel.MAX_TRACKS = 24;
RotaryModel.NUM_AUX = 4;
//# sourceMappingURL=rotary.js.map