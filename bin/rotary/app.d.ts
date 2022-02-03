import { ObservableValueImpl, Terminable } from "../lib/common.js";
import { RotaryModel, RotaryTrackModel } from "./model.js";
import { RotaryTrackEditorExecutor } from "./editor.js";
import { Audio, AudioSceneController } from "./audio.js";
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
    private readonly elements;
    static FPS: number;
    static create(rotary: RotaryModel): RotaryApp;
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
    private randomizeAll;
    private createSelector;
    private removeSelector;
    private reorderSelectors;
}
export declare class RotaryTrackSelector implements Terminable {
    readonly ui: RotaryApp;
    readonly model: RotaryTrackModel;
    readonly element: HTMLElement;
    readonly radio: HTMLInputElement;
    readonly button: HTMLButtonElement;
    private readonly terminator;
    private readonly canvas;
    private readonly context;
    private readonly mute;
    private readonly solo;
    constructor(ui: RotaryApp, model: RotaryTrackModel, element: HTMLElement, radio: HTMLInputElement, button: HTMLButtonElement);
    updatePreview(): void;
    terminate(): void;
}
