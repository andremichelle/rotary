declare module "lib/math" {
    export interface Random {
        nextDouble(min: number, max: number): number;
    }
    export class JsRandom implements Random {
        static Instance: JsRandom;
        private constructor();
        nextDouble(min: number, max: number): number;
    }
    export class Mulberry32 implements Random {
        private seed;
        constructor(seed: number);
        nextDouble(min: number, max: number): number;
        private uniform;
    }
    export class SmoothStep {
        static fx(x: number): number;
        static edge(edge0: number, edge1: number, x: number): number;
    }
}
declare module "lib/mapping" {
    export abstract class Range {
        readonly min: number;
        readonly max: number;
        private constructor();
        clamp(value: number): number;
    }
    export interface ValueMapping<Y> {
        y(x: number): Y;
        x(y: Y): number;
        clamp(y: Y): Y;
    }
    export class Linear implements ValueMapping<number>, Range {
        readonly min: number;
        readonly max: number;
        static Identity: Linear;
        static Bipolar: Linear;
        static Percent: Linear;
        private readonly range;
        constructor(min: number, max: number);
        x(y: number): number;
        y(x: number): number;
        clamp(y: number): number;
    }
    export class LinearInteger implements ValueMapping<number>, Range {
        static Percent: Linear;
        readonly min: number;
        readonly max: number;
        private readonly range;
        constructor(min: number, max: number);
        x(y: number): number;
        y(x: number): number;
        clamp(y: number): number;
    }
    export class Exp implements ValueMapping<number>, Range {
        readonly min: number;
        readonly max: number;
        private readonly range;
        constructor(min: number, max: number);
        x(y: number): number;
        y(x: number): number;
        clamp(y: number): number;
    }
    export class Boolean implements ValueMapping<boolean> {
        x(y: any): 1 | 0;
        y(x: any): boolean;
        clamp(y: boolean): boolean;
    }
    export class Volume implements ValueMapping<number>, Range {
        readonly min: number;
        readonly mid: number;
        readonly max: number;
        static Default: Volume;
        private readonly a;
        private readonly b;
        private readonly c;
        constructor(min?: number, mid?: number, max?: number);
        y(x: any): number;
        x(y: any): number;
        clamp(y: number): number;
    }
    export type Parser<Y> = (text: string) => Y | null;
    export type Printer<Y> = (value: Y) => string;
    export class PrintMapping<Y> {
        private readonly parser;
        private readonly printer;
        private readonly preUnit;
        private readonly postUnit;
        static UnipolarPercent: PrintMapping<number>;
        static RGB: PrintMapping<number>;
        constructor(parser: Parser<Y>, printer: Printer<Y>, preUnit?: string, postUnit?: string);
        static integer(postUnit: string): PrintMapping<number>;
        parse(text: string): Y | null;
        print(value: Y): string;
    }
}
declare module "lib/common" {
    import { Random } from "lib/math";
    import { Range, ValueMapping } from "lib/mapping";
    export const TAU: number;
    export interface Terminable {
        terminate(): void;
    }
    export class TerminableVoid implements Terminable {
        static Instance: TerminableVoid;
        terminate(): void;
    }
    export class Terminator implements Terminable {
        private readonly terminables;
        with<T extends Terminable>(terminable: T): T;
        terminate(): void;
    }
    export type Observer<VALUE> = (value: VALUE) => void;
    export interface Observable<VALUE> extends Terminable {
        addObserver(observer: Observer<VALUE>): Terminable;
        removeObserver(observer: Observer<VALUE>): boolean;
    }
    export class ObservableImpl<T> implements Observable<T> {
        private readonly observers;
        notify(value: T): void;
        addObserver(observer: Observer<T>): Terminable;
        removeObserver(observer: Observer<T>): boolean;
        terminate(): void;
    }
    export interface Serializer<T> {
        serialize(): T;
        deserialize(format: T): Serializer<T>;
    }
    export interface Value<T> {
        set(value: T): boolean;
        get(): T;
    }
    export interface ObservableValue<T> extends Value<T>, Observable<ObservableValue<T>> {
    }
    export class ObservableValueVoid implements ObservableValue<any> {
        static Instance: ObservableValueVoid;
        addObserver(observer: Observer<ObservableValue<any>>): Terminable;
        get(): any;
        removeObserver(observer: Observer<ObservableValue<any>>): boolean;
        set(value: any): boolean;
        terminate(): void;
    }
    export enum CollectionEventType {
        Add = 0,
        Remove = 1,
        Order = 2
    }
    export class CollectionEvent<T> {
        readonly collection: ObservableCollection<T>;
        readonly type: CollectionEventType;
        readonly item: T;
        readonly index: number;
        constructor(collection: ObservableCollection<T>, type: CollectionEventType, item?: T, index?: number);
    }
    export class ObservableCollection<T> implements Observable<CollectionEvent<T>> {
        private readonly observable;
        private readonly values;
        add(value: T, index?: number): boolean;
        addAll(values: T[]): void;
        remove(value: T): boolean;
        removeIndex(index: number): boolean;
        clear(): void;
        get(index: number): T;
        indexOf(value: T): number;
        size(): number;
        map<U>(fn: (value: T, index: number, array: T[]) => U): U[];
        forEach(fn: (value: T, index: number) => void): void;
        reduce<U>(fn: (previousValue: U, currentValue: T, currentIndex: number) => U, initialValue: U): U;
        addObserver(observer: Observer<CollectionEvent<T>>): Terminable;
        removeObserver(observer: Observer<CollectionEvent<T>>): boolean;
        terminate(): void;
    }
    export class ObservableValueImpl<T> implements ObservableValue<T> {
        private value;
        private readonly observable;
        constructor(value: T);
        get(): T;
        set(value: T): boolean;
        addObserver(observer: Observer<ObservableValueImpl<T>>): Terminable;
        removeObserver(observer: Observer<ObservableValueImpl<T>>): boolean;
        terminate(): void;
    }
    export interface Stepper {
        decrease(value: ObservableValue<number>): void;
        increase(value: ObservableValue<number>): void;
    }
    export class NumericStepper implements Stepper {
        private readonly step;
        static Integer: NumericStepper;
        static FloatPercent: NumericStepper;
        constructor(step?: number);
        decrease(value: ObservableValue<number>): void;
        increase(value: ObservableValue<number>): void;
    }
    export class BoundNumericValue implements ObservableValue<number> {
        private readonly range;
        private value;
        private readonly observable;
        constructor(range?: Range, value?: number);
        get(): number;
        set(value: number): boolean;
        addObserver(observer: Observer<BoundNumericValue>): Terminable;
        removeObserver(observer: Observer<BoundNumericValue>): boolean;
        terminate(): void;
    }
    export const binarySearch: (values: Float32Array, key: number) => number;
    export class UniformRandomMapping implements ValueMapping<number> {
        private readonly random;
        private readonly resolution;
        private readonly roughness;
        private readonly strength;
        private readonly values;
        constructor(random: Random, resolution?: number, roughness?: number, strength?: number);
        static monotoneRandom(random: Random, n: number, roughness: number, strength: number): Float32Array;
        clamp(y: number): number;
        x(y: number): number;
        y(x: number): number;
    }
}
declare module "rotary/motion" {
    import { BoundNumericValue, ObservableValueImpl, Serializer, Terminable, Terminator } from "lib/common";
    import { Random } from "lib/math";
    type Data = PowData | CShapeData | SmoothStepData;
    export interface MotionFormat<DATA extends Data> {
        phaseOffset: number;
        frequency: number;
        reverse: boolean;
        class: string;
        data: DATA;
    }
    export abstract class Motion<DATA extends Data> implements Serializer<MotionFormat<DATA>>, Terminable {
        static from(format: MotionFormat<any>): Motion<any>;
        static random(random: Random): Motion<any>;
        protected readonly terminator: Terminator;
        readonly phaseOffset: BoundNumericValue;
        readonly frequency: BoundNumericValue;
        readonly reverse: ObservableValueImpl<boolean>;
        abstract map(x: number): number;
        abstract deserialize(format: MotionFormat<DATA>): Motion<DATA>;
        abstract serialize(): MotionFormat<DATA>;
        randomize(random: Random): Motion<DATA>;
        pack(data: DATA): MotionFormat<DATA>;
        unpack(format: MotionFormat<DATA>): DATA;
        moveTo(phase: number): number;
        terminate(): void;
    }
    export class LinearMotion extends Motion<never> {
        map(x: number): number;
        serialize(): MotionFormat<never>;
        deserialize(format: MotionFormat<never>): LinearMotion;
        randomize(random: Random): Motion<never>;
    }
    interface PowData {
        exponent: number;
    }
    export class PowMotion extends Motion<PowData> {
        private readonly range;
        readonly exponent: BoundNumericValue;
        map(x: number): number;
        serialize(): MotionFormat<PowData>;
        deserialize(format: MotionFormat<PowData>): PowMotion;
        randomize(random: Random): Motion<PowData>;
    }
    interface CShapeData {
        shape: number;
    }
    export class CShapeMotion extends Motion<CShapeData> {
        readonly shape: BoundNumericValue;
        private o;
        private c;
        constructor();
        map(x: number): number;
        serialize(): MotionFormat<CShapeData>;
        deserialize(format: MotionFormat<CShapeData>): CShapeMotion;
        randomize(random: Random): Motion<CShapeData>;
        private update;
    }
    interface SmoothStepData {
        edge0: number;
        edge1: number;
    }
    export class SmoothStepMotion extends Motion<SmoothStepData> {
        readonly edge0: BoundNumericValue;
        readonly edge1: BoundNumericValue;
        constructor();
        map(x: number): number;
        deserialize(format: MotionFormat<SmoothStepData>): SmoothStepMotion;
        serialize(): MotionFormat<SmoothStepData>;
        randomize(random: Random): Motion<SmoothStepData>;
    }
}
declare module "rotary/model" {
    import { BoundNumericValue, ObservableCollection, ObservableValueImpl, Serializer, Terminable } from "lib/common";
    import { Random } from "lib/math";
    import { Motion, MotionFormat } from "rotary/motion";
    interface RotaryFormat {
        radiusMin: number;
        tracks: RotaryTrackFormat[];
    }
    interface RotaryTrackFormat {
        segments: number;
        width: number;
        widthPadding: number;
        length: number;
        lengthRatio: number;
        fill: number;
        rgb: number;
        motion: MotionFormat<any>;
    }
    export class RotaryModel implements Serializer<RotaryFormat>, Terminable {
        private readonly terminator;
        readonly tracks: ObservableCollection<RotaryTrackModel>;
        readonly radiusMin: BoundNumericValue;
        constructor();
        randomize(random: Random): RotaryModel;
        test(): RotaryModel;
        createTrack(index?: number): RotaryTrackModel | null;
        copyTrack(source: RotaryTrackModel, insertIndex?: number): RotaryTrackModel;
        removeTrack(track: RotaryTrackModel): boolean;
        clear(): void;
        measureRadius(): number;
        terminate(): void;
        serialize(): RotaryFormat;
        deserialize(format: RotaryFormat): RotaryModel;
    }
    export enum Fill {
        Flat = 0,
        Stroke = 1,
        Line = 2,
        Positive = 3,
        Negative = 4
    }
    export const Fills: Map<string, Fill>;
    export class RotaryTrackModel implements Serializer<RotaryTrackFormat>, Terminable {
        private readonly terminator;
        readonly segments: BoundNumericValue;
        readonly width: BoundNumericValue;
        readonly widthPadding: BoundNumericValue;
        readonly length: BoundNumericValue;
        readonly lengthRatio: BoundNumericValue;
        readonly fill: ObservableValueImpl<Fill>;
        readonly motion: ObservableValueImpl<Motion<any>>;
        readonly rgb: ObservableValueImpl<number>;
        private readonly gradient;
        constructor();
        opaque(): string;
        transparent(): string;
        randomize(random: Random): RotaryTrackModel;
        terminate(): void;
        serialize(): RotaryTrackFormat;
        deserialize(format: RotaryTrackFormat): RotaryTrackModel;
        private updateGradient;
    }
}
declare module "dom/common" {
    import { Terminable } from "lib/common";
    export class Dom {
        static bindEventListener(target: EventTarget, type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): Terminable;
        static insertElement(parent: Element, child: Element, index?: number): void;
        static emptyNode(node: Node): void;
        static configRepeatButton(button: any, callback: any): Terminable;
    }
}
declare module "dom/inputs" {
    import { NumericStepper, ObservableValue, Terminable } from "lib/common";
    import { PrintMapping } from "lib/mapping";
    export class Checkbox implements Terminable {
        private readonly element;
        private readonly terminator;
        private value;
        constructor(element: HTMLInputElement);
        withValue(value: ObservableValue<boolean>): Checkbox;
        init(): void;
        update(): void;
        terminate(): void;
        private readonly observer;
    }
    export class SelectInput<T> implements Terminable {
        private readonly select;
        private readonly map;
        private readonly terminator;
        private value;
        private readonly options;
        private readonly values;
        constructor(select: HTMLSelectElement, map: Map<string, T>);
        withValue(value: ObservableValue<T>): SelectInput<T>;
        terminate(): void;
        private observer;
        private update;
        private connect;
    }
    export class NumericStepperInput implements Terminable {
        private readonly parent;
        private readonly printMapping;
        private readonly stepper;
        private readonly terminator;
        private value;
        private readonly decreaseButton;
        private readonly increaseButton;
        private readonly input;
        constructor(parent: HTMLElement, printMapping: PrintMapping<number>, stepper: NumericStepper);
        withValue(value: ObservableValue<number>): NumericStepperInput;
        connect(): void;
        parse(): number | null;
        update(): void;
        terminate(): void;
        private readonly observer;
    }
    export class NumericInput implements Terminable {
        private readonly input;
        private readonly printMapping;
        private readonly terminator;
        private value;
        constructor(input: HTMLInputElement, printMapping: PrintMapping<number>);
        withValue(value: ObservableValue<number>): NumericInput;
        connect(): void;
        parse(): number | null;
        update(): void;
        terminate(): void;
        private readonly observer;
    }
}
declare module "rotary/editor" {
    import { Terminable } from "lib/common";
    import { RotaryTrackModel } from "rotary/model";
    export interface RotaryTrackEditorExecutor {
        delete(subject: RotaryTrackModel): void;
    }
    export class RotaryTrackEditor implements Terminable {
        private readonly executor;
        subject: RotaryTrackModel | null;
        private readonly terminator;
        private readonly segments;
        private readonly width;
        private readonly widthPadding;
        private readonly length;
        private readonly lengthRatio;
        private readonly fill;
        private readonly rgb;
        constructor(executor: RotaryTrackEditorExecutor, parentNode: ParentNode);
        edit(model: RotaryTrackModel): void;
        clear(): void;
        terminate(): void;
    }
}
declare module "rotary/render" {
    import { Fill, RotaryModel, RotaryTrackModel } from "rotary/model";
    export class RotaryRenderer {
        private readonly context;
        private readonly rotary;
        private hightlight;
        constructor(context: CanvasRenderingContext2D, rotary: RotaryModel);
        draw(position: number): void;
        drawTrack(model: RotaryTrackModel, radiusMin: number, position: number): void;
        drawSection(model: RotaryTrackModel, radiusMin: number, radiusMax: number, angleMin: number, angleMax: number, fill: Fill): void;
        showHighlight(model: RotaryTrackModel): void;
        releaseHighlight(): void;
    }
}
declare module "rotary/ui" {
    import { Terminable } from "lib/common";
    import { RotaryModel, RotaryTrackModel } from "rotary/model";
    import { RotaryTrackEditorExecutor } from "rotary/editor";
    import { RotaryRenderer } from "rotary/render";
    export class RotaryUI implements RotaryTrackEditorExecutor {
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
        createNew(model: RotaryTrackModel, copy: boolean): void;
        delete(model?: RotaryTrackModel): void;
        select(model: RotaryTrackModel): void;
        hasSelected(): boolean;
        showHighlight(model: RotaryTrackModel): void;
        releaseHighlight(): void;
        private createSelector;
        private removeSelector;
        private reorderSelectors;
    }
    export class RotaryTrackSelector implements Terminable {
        readonly ui: RotaryUI;
        readonly model: RotaryTrackModel;
        readonly element: HTMLElement;
        readonly radio: HTMLInputElement;
        readonly button: HTMLButtonElement;
        private readonly terminator;
        constructor(ui: RotaryUI, model: RotaryTrackModel, element: HTMLElement, radio: HTMLInputElement, button: HTMLButtonElement);
        terminate(): void;
    }
}
declare module "main" { }
declare namespace menu {
    export class ListItemDefaultData {
        readonly label: string;
        readonly shortcut: string;
        readonly checked: boolean;
        constructor(label: string, shortcut?: string, checked?: boolean);
        toString(): string;
    }
    export class ListItem {
        readonly data: any;
        separatorBefore: boolean;
        selectable: boolean;
        private readonly permanentChildren;
        private readonly transientChildren;
        private transientChildrenCallback;
        private openingCallback;
        private triggerCallback;
        private isOpening;
        constructor(data: any);
        static root(): ListItem;
        static default(label: string, shortcut: any, checked: boolean): ListItem;
        addListItem(listItem: ListItem): ListItem;
        opening(): void;
        trigger(): void;
        isSelectable(value?: boolean): ListItem;
        addSeparatorBefore(): ListItem;
        addRuntimeChildrenCallback(callback: (parent: ListItem) => void): ListItem;
        onOpening(callback: (listItem: ListItem) => void): ListItem;
        onTrigger(callback: (listItem: ListItem) => void): ListItem;
        hasChildren(): boolean;
        collectChildren(): ListItem[];
        removeTransientChildren(): void;
    }
    class Controller {
        private readonly mouseDownHandler;
        private root;
        private layer;
        private onClose;
        constructor();
        open(listItem: ListItem, onClose: () => void, x: number, y: number, docked: boolean): void;
        close(): void;
        onDispose(pullDown: any): void;
        shutdown(): void;
        iterateAll(callback: any): void;
        reduceAll(callback: any): number;
    }
    export class Menu {
        private listItem;
        static Controller: Controller;
        static Renderer: Map<any, (element: HTMLElement, data: any) => void>;
        childMenu: Menu;
        private element;
        private readonly container;
        private readonly scrollUp;
        private readonly scrollDown;
        private selectedDiv;
        private x;
        private y;
        constructor(listItem: ListItem, docked?: boolean);
        moveTo(x: any, y: any): void;
        attach(parentNode: Element, parentMenu?: Menu): void;
        dispose(): void;
        domElement(): HTMLElement;
        isChild(target: Node): boolean;
        private makeScrollable;
    }
    export class MenuBar {
        private offsetX;
        private offsetY;
        private openListItem;
        constructor();
        static install(): MenuBar;
        offset(x: number, y: number): MenuBar;
        addButton(button: HTMLElement, listItem: ListItem): MenuBar;
        open(button: HTMLElement, listItem: ListItem): void;
    }
    export {};
}
