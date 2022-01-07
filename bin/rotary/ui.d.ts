import { Terminable } from "../lib/common.js";
import { RotaryModel, RotaryTrackModel } from "./model.js";
import { RotaryTrackEditorExecutor } from "./editor.js";
import { RotaryRenderer } from "./render.js";
export declare class RotaryUI implements RotaryTrackEditorExecutor {
    private readonly form;
    private readonly selectors;
    private readonly template;
    private readonly model;
    private readonly renderer;
    private readonly terminator;
    private readonly editor;
    private readonly map;
    private readonly random;
    constructor(form: HTMLFormElement, selectors: Element, template: Element, model: RotaryModel, renderer: RotaryRenderer);
    static create(rotary: RotaryModel, renderer: RotaryRenderer): RotaryUI;
    createNew(model: RotaryTrackModel | null, copy: boolean): void;
    deleteTrack(): void;
    select(model: RotaryTrackModel): void;
    hasSelected(): boolean;
    showHighlight(model: RotaryTrackModel): void;
    releaseHighlight(): void;
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
