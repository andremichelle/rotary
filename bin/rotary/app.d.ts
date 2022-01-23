import { ObservableValueImpl, Terminable } from "../lib/common.js";
import { RotaryModel, RotaryTrackModel } from "./model.js";
import { RotaryTrackEditorExecutor } from "./editor.js";
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
    static create(rotary: RotaryModel): RotaryApp;
    private readonly terminator;
    private readonly editor;
    private readonly map;
    private readonly random;
    private readonly c2D;
    readonly zoom: ObservableValueImpl<number>;
    private constructor();
    createNew(model: RotaryTrackModel | null, copy: boolean): void;
    deleteTrack(): void;
    select(track: RotaryTrackModel): void;
    hasSelected(): boolean;
    render(phase: number): void;
    private drawCrossing;
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
    constructor(ui: RotaryApp, model: RotaryTrackModel, element: HTMLElement, radio: HTMLInputElement, button: HTMLButtonElement);
    updatePreview(): void;
    terminate(): void;
}
