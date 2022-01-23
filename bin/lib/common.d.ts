import { Random } from "./math.js";
import { Range, ValueMapping } from "./mapping.js";
export declare const TAU: number;
export interface Terminable {
    terminate(): void;
}
export declare class TerminableVoid implements Terminable {
    static Instance: TerminableVoid;
    terminate(): void;
}
export declare class Terminator implements Terminable {
    private readonly terminables;
    with<T extends Terminable>(terminable: T): T;
    terminate(): void;
}
export interface Option<T> {
    get(): T;
    ifPresent(callback: (value: T) => void): void;
    contains(value: T): boolean;
    isEmpty(): boolean;
    nonEmpty(): boolean;
}
export declare class Options {
    static valueOf<T>(value: T): Option<T>;
    static Some: {
        new <T>(value: T): {
            readonly value: T;
            get: () => T;
            contains: (value: T) => boolean;
            ifPresent: (callback: (value: T) => void) => void;
            isEmpty: () => boolean;
            nonEmpty: () => boolean;
            toString(): string;
        };
    };
    static None: {
        get: () => never;
        contains: (_: never) => boolean;
        ifPresent: (_: (value: never) => void) => void;
        isEmpty: () => boolean;
        nonEmpty: () => boolean;
        toString(): string;
    };
}
export declare type Observer<VALUE> = (value: VALUE) => void;
export interface Observable<VALUE> extends Terminable {
    addObserver(observer: Observer<VALUE>): Terminable;
    removeObserver(observer: Observer<VALUE>): boolean;
}
export declare class ObservableImpl<T> implements Observable<T> {
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
export interface ObservableValue<T> extends Value<T>, Observable<T> {
}
export declare class ObservableValueVoid implements ObservableValue<any> {
    static Instance: ObservableValueVoid;
    addObserver(observer: Observer<any>): Terminable;
    get(): any;
    removeObserver(observer: Observer<any>): boolean;
    set(value: any): boolean;
    terminate(): void;
}
export declare enum CollectionEventType {
    Add = 0,
    Remove = 1,
    Order = 2
}
export declare class CollectionEvent<T> {
    readonly collection: ObservableCollection<T>;
    readonly type: CollectionEventType;
    readonly item: T;
    readonly index: number;
    constructor(collection: ObservableCollection<T>, type: CollectionEventType, item?: T, index?: number);
}
export declare class ObservableCollection<T> implements Observable<CollectionEvent<T>> {
    static observeNested<U extends Observable<U>>(collection: ObservableCollection<U>, observer: (collection: ObservableCollection<U>) => void): Terminable;
    private readonly observable;
    private readonly values;
    add(value: T, index?: number): boolean;
    addAll(values: T[]): void;
    remove(value: T): boolean;
    removeIndex(index: number): boolean;
    clear(): void;
    get(index: number): T;
    first(): Option<T>;
    indexOf(value: T): number;
    size(): number;
    map<U>(fn: (value: T, index: number, array: T[]) => U): U[];
    forEach(fn: (value: T, index: number) => void): void;
    reduce<U>(fn: (previousValue: U, currentValue: T, currentIndex: number) => U, initialValue: U): U;
    addObserver(observer: Observer<CollectionEvent<T>>): Terminable;
    removeObserver(observer: Observer<CollectionEvent<T>>): boolean;
    terminate(): void;
}
export declare class ObservableValueImpl<T> implements ObservableValue<T> {
    private value?;
    private readonly observable;
    constructor(value?: T);
    get(): T;
    set(value: T): boolean;
    addObserver(observer: Observer<T>): Terminable;
    removeObserver(observer: Observer<T>): boolean;
    terminate(): void;
}
export declare class BoundNumericValue implements ObservableValue<number> {
    private readonly range;
    private value;
    private readonly observable;
    constructor(range?: Range, value?: number);
    get(): number;
    set(value: number): boolean;
    addObserver(observer: Observer<number>): Terminable;
    removeObserver(observer: Observer<number>): boolean;
    terminate(): void;
}
export interface Stepper {
    decrease(value: ObservableValue<number>): void;
    increase(value: ObservableValue<number>): void;
}
export declare class NumericStepper implements Stepper {
    private readonly step;
    static Integer: NumericStepper;
    static Hundredth: NumericStepper;
    constructor(step?: number);
    decrease(value: ObservableValue<number>): void;
    increase(value: ObservableValue<number>): void;
}
export declare type Parser<Y> = (text: string) => Y | null;
export declare type Printer<Y> = (value: Y) => string;
export declare class PrintMapping<Y> {
    private readonly parser;
    private readonly printer;
    private readonly preUnit;
    private readonly postUnit;
    static UnipolarPercent: PrintMapping<number>;
    static RGB: PrintMapping<number>;
    static integer(postUnit: string): PrintMapping<number>;
    static float(numPrecision: number, preUnit: string, postUnit: string): PrintMapping<number>;
    constructor(parser: Parser<Y>, printer: Printer<Y>, preUnit?: string, postUnit?: string);
    parse(text: string): Y | null;
    print(value: Y): string;
}
export declare const binarySearch: (values: Float32Array, key: number) => number;
export declare class UniformRandomMapping implements ValueMapping<number> {
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
export declare const readBinary: (url: string) => Promise<ArrayBuffer>;
export declare const readAudio: (context: AudioContext, url: string) => Promise<AudioBuffer>;
export declare const decodeAudioData: (context: AudioContext, buffer: ArrayBuffer) => Promise<AudioBuffer>;
export declare const timeToString: (seconds: number) => string;
export declare class Estimation {
    private lastPercent;
    private startTime;
    update(progress: number): string;
}
export interface Iterator<T> {
    hasNext(): boolean;
    next(): T;
}
export declare const EmptyIterator: {
    hasNext(): boolean;
    next(): any;
};
export declare class GeneratorIterator<T> {
    private readonly generator;
    static wrap<T>(generator: Generator<T, void, T>): Iterator<T>;
    private curr;
    constructor(generator: Generator<T>);
    hasNext(): boolean;
    next(): T;
}
