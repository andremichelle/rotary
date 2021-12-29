declare module "lib/common" {
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
    export interface ValueMapping<Y> {
        y(x: number): Y;
        x(y: Y): number;
        clamp(y: Y): Y;
    }
    export class Linear implements ValueMapping<number> {
        private readonly min;
        private readonly max;
        static Identity: Linear;
        static Bipolar: Linear;
        static Percent: Linear;
        private readonly range;
        constructor(min: number, max: number);
        x(y: number): number;
        y(x: number): number;
        clamp(y: number): number;
    }
    export class LinearInteger implements ValueMapping<number> {
        static Percent: Linear;
        private readonly min;
        private readonly max;
        private readonly range;
        constructor(min: number, max: number);
        x(y: number): number;
        y(x: number): number;
        clamp(y: number): number;
    }
    export class Exp implements ValueMapping<number> {
        private readonly min;
        private readonly max;
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
    export class Volume implements ValueMapping<number> {
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
        static integer(postUnit: string): PrintMapping<number>;
        static UnipolarPercent: PrintMapping<number>;
        static RGB: PrintMapping<number>;
        constructor(parser: Parser<Y>, printer: Printer<Y>, preUnit?: string, postUnit?: string);
        parse(text: string): Y | null;
        print(value: Y): string;
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
    export class Parameter implements ObservableValue<number> {
        readonly mapping: ValueMapping<number>;
        private value;
        private readonly observable;
        constructor(mapping?: ValueMapping<number>, value?: number);
        get(): number;
        unipolar(): number;
        set(value: number): boolean;
        addObserver(observer: Observer<Parameter>): Terminable;
        removeObserver(observer: Observer<Parameter>): boolean;
        terminate(): void;
    }
}
declare module "rotary/model" {
    import { ObservableValueImpl, Parameter, Terminable } from "lib/common";
    export class RotaryModel implements Terminable {
        private readonly terminator;
        readonly radiusMin: Parameter;
        readonly tracks: RotaryTrackModel[];
        constructor();
        randomize(): void;
        createTrack(insertIndex?: number): RotaryTrackModel;
        copyTrack(source: RotaryTrackModel, insertIndex?: number): RotaryTrackModel;
        removeTrack(track: RotaryTrackModel): boolean;
        measureRadius(): number;
        terminate(): void;
    }
    export enum Fill {
        Flat = 0,
        Stroke = 1,
        Line = 2,
        Positive = 3,
        Negative = 4
    }
    export type Move = (x: number) => number;
    export const Movements: Map<string, (x: any) => any>;
    export const randomMovement: () => Move;
    export const Fills: Map<string, Fill>;
    export class RotaryTrackModel implements Terminable {
        private readonly terminator;
        private readonly gradient;
        readonly segments: Parameter;
        readonly width: Parameter;
        readonly widthPadding: Parameter;
        readonly length: Parameter;
        readonly lengthRatio: Parameter;
        readonly phase: Parameter;
        readonly fill: ObservableValueImpl<Fill>;
        readonly movement: ObservableValueImpl<Move>;
        readonly reverse: ObservableValueImpl<boolean>;
        readonly rgb: ObservableValueImpl<number>;
        constructor();
        opaque(): string;
        transparent(): string;
        randomize(): void;
        terminate(): void;
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
    import { NumericStepper, ObservableValue, PrintMapping, Terminable } from "lib/common";
    export class Checkbox implements Terminable {
        private readonly element;
        private readonly terminator;
        private readonly observer;
        private value;
        constructor(element: HTMLInputElement);
        withValue(value: ObservableValue<boolean>): Checkbox;
        init(): void;
        update(): void;
        terminate(): void;
    }
    export class SelectInput<T> implements Terminable {
        private readonly select;
        private readonly map;
        private readonly terminator;
        private value;
        private observer;
        private readonly options;
        private readonly values;
        constructor(select: HTMLSelectElement, map: Map<string, T>);
        withValue(value: ObservableValue<T>): SelectInput<T>;
        terminate(): void;
        private update;
        private connect;
    }
    export class NumericStepperInput implements Terminable {
        private readonly parent;
        private readonly printMapping;
        private readonly stepper;
        private readonly terminator;
        private readonly observer;
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
    }
    export class NumericInput implements Terminable {
        private readonly input;
        private readonly printMapping;
        private readonly terminator;
        private readonly observer;
        private value;
        constructor(input: HTMLInputElement, printMapping: PrintMapping<number>);
        withValue(value: ObservableValue<number>): NumericInput;
        connect(): void;
        parse(): number | null;
        update(): void;
        terminate(): void;
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
        private readonly terminator;
        private readonly segments;
        private readonly width;
        private readonly widthPadding;
        private readonly length;
        private readonly lengthRatio;
        private readonly phase;
        private readonly fill;
        private readonly rgb;
        private readonly movement;
        private readonly reverse;
        private subject;
        constructor(executor: RotaryTrackEditorExecutor, parentNode: ParentNode);
        edit(model: RotaryTrackModel): void;
        clear(): void;
        terminate(): void;
    }
}
declare module "rotary/view" {
    import { RotaryModel, RotaryTrackModel } from "rotary/model";
    import { RotaryTrackEditorExecutor } from "rotary/editor";
    export class RotarySelector implements RotaryTrackEditorExecutor {
        private readonly form;
        private readonly selectors;
        private readonly template;
        private readonly model;
        static create(document: Document, rotary: RotaryModel): RotarySelector;
        private readonly terminator;
        private readonly map;
        private readonly editor;
        constructor(form: HTMLFormElement, selectors: Node, template: Element, model: RotaryModel);
        createSelector(trackModel: RotaryTrackModel): void;
        select(model: RotaryTrackModel): void;
        createNew(model: RotaryTrackModel, copy: boolean): void;
        delete(model: RotaryTrackModel): void;
        updateOrder(): void;
    }
}
declare module "rotary/render" {
    import { Fill, RotaryModel, RotaryTrackModel } from "rotary/model";
    export class RotaryRenderer {
        static draw(context: CanvasRenderingContext2D, rotary: RotaryModel, position: number): void;
        static drawTrack(context: CanvasRenderingContext2D, model: RotaryTrackModel, radiusMin: number, position: number): void;
        static drawSection(context: CanvasRenderingContext2D, model: RotaryTrackModel, radiusMin: number, radiusMax: number, angleMin: number, angleMax: number, fill?: Fill): void;
    }
}
declare module "main" { }
