import { ObservableValueImpl, Terminable } from "../lib/common.js";
import { RotaryTrackEditorExecutor } from "./editor.js";
import { Audio, AudioSceneController } from "./audio.js";
import { RotaryModel } from "./model/rotary";
import { RotaryTrackModel } from "./model/track";
export interface DomElements {
    form: HTMLFormElement;
    selectors: HTMLElement;
    template: HTMLElement;
    canvas: HTMLCanvasElement;
    labelSize: HTMLLabelElement;
    labelZoom: HTMLLabelElement;
    progressIndicator: SVGCircleElement;
}
export declare class RotaryApp implements RotaryTrackEditorExecutor {
    private readonly model;
    private readonly preview;
    private readonly elements;
    static FPS: number;
    static create(rotary: RotaryModel, preview: AudioSceneController): RotaryApp;
    private readonly terminator;
    private readonly editor;
    private readonly map;
    private readonly random;
    private readonly liveContext;
    private readonly rawCanvas;
    private readonly rawContext;
    readonly zoom: ObservableValueImpl<number>;
    private constructor();
    createNew(model: RotaryTrackModel | null, copy: boolean): void;
    deleteTrack(trackModel: RotaryTrackModel): void;
    moveTrackLeft(trackModel: RotaryTrackModel): void;
    moveTrackRight(trackModel: RotaryTrackModel): void;
    select(track: RotaryTrackModel): void;
    hasSelected(): boolean;
    render(phase: number): void;
    installShortcuts(audio: Audio, preview: AudioSceneController): RotaryApp;
    installApplicationMenu(audio: Audio): RotaryApp;
    toggleFullscreen(): Promise<void>;
    peak(model: RotaryTrackModel): Float32Array;
    private randomizeAll;
    private createSelector;
    private removeSelector;
    private reorderSelectors;
}
export declare class RotaryTrackSelector implements Terminable {
    readonly app: RotaryApp;
    readonly model: RotaryTrackModel;
    readonly element: HTMLElement;
    readonly radio: HTMLInputElement;
    readonly button: HTMLButtonElement;
    private readonly terminator;
    private readonly previewCanvas;
    private readonly previewContext;
    private readonly peaksCanvas;
    private readonly peaksContext;
    private readonly mute;
    private readonly solo;
    constructor(app: RotaryApp, model: RotaryTrackModel, element: HTMLElement, radio: HTMLInputElement, button: HTMLButtonElement);
    updatePreview(): void;
    updatePeaks(): void;
    terminate(): void;
}
