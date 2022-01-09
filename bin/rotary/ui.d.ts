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
export declare class RotaryUI implements RotaryTrackEditorExecutor {
    private readonly model;
    private readonly elements;
    static create(rotary: RotaryModel): RotaryUI;
    private readonly terminator;
    private readonly editor;
    private readonly map;
    private readonly random;
    private readonly c2D;
    private readonly renderer;
    readonly zoom: ObservableValueImpl<number>;
    private constructor();
    createNew(model: RotaryTrackModel | null, copy: boolean): void;
    deleteTrack(): void;
    select(track: RotaryTrackModel): void;
    hasSelected(): boolean;
    showHighlight(track: RotaryTrackModel): void;
    releaseHighlight(): void;
    render(progress?: number): void;
    private createSelector;
    private removeSelector;
    private reorderSelectors;
}
export declare class RotaryTrackSelector implements Terminable {
    readonly ui: RotaryUI;
    readonly model: RotaryTrackModel;
    readonly element: HTMLElement;
    readonly radio: HTMLInputElement;
    readonly button: HTMLButtonElement;
    private readonly terminator;
    constructor(ui: RotaryUI, model: RotaryTrackModel, element: HTMLElement, radio: HTMLInputElement, button: HTMLButtonElement);
    setIndex(index: number): void;
    terminate(): void;
}
