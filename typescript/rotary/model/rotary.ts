import {
    CompositeSettings,
    CompositeSettingsFormat,
    ConvolverFiles,
    ConvolverSettings,
    FlangerSettings,
    PulsarDelaySettings
} from "../../audio/composite.js"
import {
    ArrayUtils,
    BoundNumericValue,
    Observable,
    ObservableCollection,
    ObservableImpl,
    ObservableValue,
    ObservableValueImpl,
    Observer,
    Serializer,
    Terminable,
    Terminator
} from "../../lib/common.js"
import {Linear, LinearInteger} from "../../lib/mapping.js"
import {createRenderConfiguration, RenderConfiguration} from "../render.js"
import {Random} from "../../lib/math.js"
import {Colors} from "../../lib/colors.js"
import {barsToSeconds} from "../../audio/common.js"
import {RotaryTrackFormat, RotaryTrackModel, Segment} from "./track.js"

export declare interface RotaryExportFormat {
    fps: number
    subFrames: number
    size: number
}

export declare interface RotaryFormat {
    radiusMin: number
    phaseOffset: number
    bpm: number
    stretch: number
    exportSettings: RotaryExportFormat
    tracks: RotaryTrackFormat[],
    aux: CompositeSettingsFormat<any>[]
}

export class RotaryExportSetting implements Terminable, Serializer<RotaryExportFormat> {
    private readonly terminator: Terminator = new Terminator()

    readonly size = this.terminator.with(new BoundNumericValue(new LinearInteger(128, 2048), 256))
    readonly fps = this.terminator.with(new BoundNumericValue(new LinearInteger(12, 120), 60))
    readonly subFrames = this.terminator.with(new BoundNumericValue(new LinearInteger(1, 64), 16))

    deserialize(format: RotaryExportFormat): RotaryExportSetting {
        this.size.set(format.size)
        this.fps.set(format.fps)
        this.subFrames.set(format.subFrames)
        return this
    }

    serialize(): RotaryExportFormat {
        return {fps: this.fps.get(), subFrames: this.subFrames.get(), size: this.size.get()}
    }

    getConfiguration(numFrames: number): RenderConfiguration {
        return createRenderConfiguration({
            size: this.size.get(),
            motionFrames: this.subFrames.get(),
            fps: this.fps.get(),
            numFrames: numFrames
        })
    }

    terminate(): void {
        this.terminator.terminate()
    }
}

const convolverSettingsA = new ConvolverSettings()
const convolverSettingsB = new ConvolverSettings()
const paths = Array.from(ConvolverFiles.values())
convolverSettingsA.url.set(paths[1])
convolverSettingsB.url.set(paths[3])

export class RotaryModel implements Observable<RotaryModel>, Serializer<RotaryFormat>, Terminable {
    static MAX_TRACKS = 24
    static NUM_AUX = 4

    private readonly terminator: Terminator = new Terminator()
    private readonly observable: ObservableImpl<RotaryModel> = new ObservableImpl<RotaryModel>()

    readonly tracks: ObservableCollection<RotaryTrackModel> = new ObservableCollection()
    readonly exportSettings: RotaryExportSetting = this.terminator.with(new RotaryExportSetting())
    readonly radiusMin = this.bindValue(new BoundNumericValue(new LinearInteger(0, 1024), 20))
    readonly phaseOffset = this.bindValue(new BoundNumericValue(Linear.Identity, 0.75))
    readonly inactiveAlpha = this.bindValue(new BoundNumericValue(Linear.Identity, 0.1))
    readonly bpm = this.bindValue(new BoundNumericValue(new Linear(30.0, 999.0), 120.0))
    readonly master_gain = this.bindValue(new BoundNumericValue(new Linear(-18.0, 18.0), 0.0))
    readonly limiter_threshold = this.bindValue(new BoundNumericValue(new Linear(-72.0, 0.0), -3.0))
    readonly stretch = this.bindValue(new BoundNumericValue(new Linear(1.0, 16.0), 4.0))
    readonly motion = this.bindValue(new BoundNumericValue(new LinearInteger(1, 32), 8))

    readonly aux: ObservableValue<CompositeSettings<any>>[] = [
        new ObservableValueImpl(new PulsarDelaySettings()),
        new ObservableValueImpl(convolverSettingsA),
        new ObservableValueImpl(new FlangerSettings()),
        new ObservableValueImpl(convolverSettingsB)
    ]

    constructor() {
        const notify = () => this.observable.notify(this)
        ObservableCollection.observeNested(this.tracks, notify)
        const auxTerminators: Terminator[] = ArrayUtils.fill(this.aux.length, () => this.terminator.with(new Terminator()))
        this.aux.forEach((value: ObservableValue<CompositeSettings<any>>, index: number) => {
            this.terminator.with(value.addObserver((compositeSettings: CompositeSettings<any>) => {
                auxTerminators[index].terminate()
                auxTerminators[index].with(compositeSettings.addObserver(notify))
            }, false))
        })
    }

    addObserver(observer: Observer<RotaryModel>, notify: boolean): Terminable {
        if (notify) observer(this)
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<RotaryModel>): boolean {
        return this.observable.removeObserver(observer)
    }

    randomize(random: Random): RotaryModel {
        this.radiusMin.set(random.nextDouble(8.0, 32.0))
        this.tracks.clear()
        const palette = Colors.getRandomPalette(random)
        const maxRadius = random.nextDouble(192, 480)
        let radius = this.radiusMin.get()
        while (radius < maxRadius) {
            const track = this.createTrack().randomize(random)
            track.rgb.set(palette[Math.floor(random.nextDouble(0.0, palette.length))])
            radius += track.width.get() + track.widthPadding.get()
        }
        return this
    }

    randomizeTracks(random: Random): RotaryModel {
        this.tracks.forEach(track => track.randomize(random))
        return this
    }

    randomizePalette(random: Random): RotaryModel {
        const palette = Colors.getRandomPalette(random)
        this.tracks.forEach(track => track.rgb.set(palette[Math.floor(random.nextDouble(0.0, palette.length))]))
        return this
    }

    // noinspection JSUnusedGlobalSymbols
    test(): RotaryModel {
        this.tracks.clear()
        this.radiusMin.set(160)
        this.phaseOffset.set(0.0)
        this.createTrack().test()
        return this
    }

    createTrack(index: number = Number.MAX_SAFE_INTEGER): RotaryTrackModel | null {
        const track = new RotaryTrackModel(this)
        return this.tracks.add(track, index) ? track : null
    }

    copyTrack(source: RotaryTrackModel, insertIndex: number = Number.MAX_SAFE_INTEGER): RotaryTrackModel {
        const copy = this.createTrack(insertIndex)
        copy.segments.set(source.segments.get())
        copy.fill.set(source.fill.get())
        copy.rgb.set(source.rgb.get())
        copy.length.set(source.length.get())
        copy.lengthRatio.set(source.lengthRatio.get())
        copy.outline.set(source.outline.get())
        copy.width.set(source.width.get())
        copy.widthPadding.set(source.widthPadding.get())
        copy.motion.set(source.motion.get().copy())
        copy.bend.set(source.bend.get())
        copy.phaseOffset.set(source.phaseOffset.get())
        copy.frequency.set(source.frequency.get())
        copy.reverse.set(source.reverse.get())
        copy.gain.set(source.gain.get())
        copy.volume.set(source.volume.get())
        copy.panning.set(source.panning.get())
        copy.aux.forEach((value: BoundNumericValue, index: number) => value.set(source.aux[index].get()))
        copy.mute.set(source.mute.get())
        copy.solo.set(source.solo.get())
        return copy
    }

    removeTrack(track: RotaryTrackModel): boolean {
        return this.tracks.remove(track)
    }

    duration(): number {
        return barsToSeconds(this.stretch.get(), this.bpm.get())
    }

    clear() {
        this.radiusMin.set(20.0)
        this.tracks.clear()
    }

    measureRadius(): number {
        const lastIndex = this.tracks.size() - 1
        return this.tracks.reduce((radius, track, index) =>
            radius + track.width.get() + (lastIndex !== index ? track.widthPadding.get() : 0)
            * Math.min(1.0, (this.tracks.size() - index - 1)), this.radiusMin.get())
    }

    intersects(phase: number): boolean {
        for (let i = 0; i < this.tracks.size(); i++) {
            const trackModel = this.tracks.get(i)
            const crossing: Segment = trackModel.localToSegment(trackModel.globalToLocal(phase))
            if (crossing !== null && !trackModel.exclude.getBit(crossing.index)) {
                return true
            }
        }
        return false
    }

    terminate(): void {
        this.terminator.terminate()
    }

    serialize(): RotaryFormat {
        return {
            radiusMin: this.radiusMin.get(),
            exportSettings: this.exportSettings.serialize(),
            phaseOffset: this.phaseOffset.get(),
            bpm: this.bpm.get(),
            stretch: this.stretch.get(),
            tracks: this.tracks.map(track => track.serialize()),
            aux: this.aux.map((value: ObservableValue<CompositeSettings<any>>): CompositeSettingsFormat<any> => value.get().serialize())
        }
    }

    deserialize(format: RotaryFormat): RotaryModel {
        this.radiusMin.set(format.radiusMin)
        this.exportSettings.deserialize(format.exportSettings)
        this.phaseOffset.set(format.phaseOffset)
        this.bpm.set(format.bpm)
        this.stretch.set(format.stretch)
        this.tracks.clear()
        this.tracks.addAll(format.tracks.map(trackFormat => new RotaryTrackModel(this).deserialize(trackFormat)))
        this.aux.forEach((value: ObservableValue<CompositeSettings<any>>, index: number) => value.set(CompositeSettings.from(format.aux[index])))
        return this
    }

    private bindValue<T>(property: ObservableValue<T>): ObservableValue<T> {
        this.terminator.with(property.addObserver(() => this.observable.notify(this), false))
        return this.terminator.with(property)
    }
}