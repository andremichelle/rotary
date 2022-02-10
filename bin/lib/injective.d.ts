import { Observable, ObservableImpl, ObservableValue, Observer, Serializer, Terminable, Terminator } from "./common.js";
import { Random } from "./math.js";
declare type InjectiveData = PowData | CShapeData | TShapeData | SmoothStepData | MonoNoiseData;
export declare type InjectiveType = {
    new (): Injective<any>;
};
export declare interface InjectiveFormat<DATA extends InjectiveData> {
    class: string;
    data: DATA;
}
export declare abstract class Injective<DATA extends InjectiveData> implements Observable<Injective<DATA>>, Serializer<InjectiveFormat<DATA>>, Terminable {
    static from(format: InjectiveFormat<any>): Injective<any>;
    static random(random: Random): Injective<any>;
    protected readonly terminator: Terminator;
    protected readonly observable: ObservableImpl<Injective<DATA>>;
    abstract fx(x: number): number;
    abstract fy(y: number): number;
    abstract deserialize(format: InjectiveFormat<DATA>): Injective<DATA>;
    abstract serialize(): InjectiveFormat<DATA>;
    abstract copy(): Injective<DATA>;
    abstract randomize(random: Random): Injective<DATA>;
    addObserver(observer: Observer<Injective<DATA>>): Terminable;
    removeObserver(observer: Observer<Injective<DATA>>): boolean;
    pack(data?: DATA): InjectiveFormat<DATA>;
    unpack(format: InjectiveFormat<DATA>): DATA;
    terminate(): void;
    protected bindValue<T>(property: ObservableValue<T>): ObservableValue<T>;
}
export declare class IdentityInjective extends Injective<never> {
    fx(x: number): number;
    fy(y: number): number;
    serialize(): InjectiveFormat<never>;
    deserialize(format: InjectiveFormat<never>): IdentityInjective;
    copy(): IdentityInjective;
    randomize(random: Random): IdentityInjective;
}
declare interface PowData {
    exponent: number;
}
export declare class PowInjective extends Injective<PowData> {
    private readonly range;
    readonly exponent: ObservableValue<number>;
    fx(x: number): number;
    fy(y: number): number;
    serialize(): InjectiveFormat<PowData>;
    deserialize(format: InjectiveFormat<PowData>): PowInjective;
    copy(): PowInjective;
    randomize(random: Random): PowInjective;
}
declare interface CShapeData {
    slope: number;
}
export declare class CShapeInjective extends Injective<CShapeData> {
    private readonly range;
    readonly slope: ObservableValue<number>;
    private o;
    private c;
    constructor();
    fx(x: number): number;
    fy(y: number): number;
    serialize(): InjectiveFormat<CShapeData>;
    deserialize(format: InjectiveFormat<CShapeData>): CShapeInjective;
    copy(): CShapeInjective;
    randomize(random: Random): CShapeInjective;
    private update;
}
declare interface TShapeData {
    shape: number;
}
export declare class TShapeInjective extends Injective<TShapeData> {
    private readonly range;
    readonly shape: ObservableValue<number>;
    constructor();
    fx(x: number): number;
    fy(y: number): number;
    serialize(): InjectiveFormat<TShapeData>;
    deserialize(format: InjectiveFormat<TShapeData>): TShapeInjective;
    copy(): TShapeInjective;
    randomize(random: Random): TShapeInjective;
}
declare interface SmoothStepData {
    edge0: number;
    edge1: number;
}
export declare class SmoothStepInjective extends Injective<SmoothStepData> {
    readonly edge0: ObservableValue<number>;
    readonly edge1: ObservableValue<number>;
    constructor();
    fx(x: number): number;
    fy(y: number): number;
    deserialize(format: InjectiveFormat<SmoothStepData>): SmoothStepInjective;
    serialize(): InjectiveFormat<SmoothStepData>;
    copy(): SmoothStepInjective;
    randomize(random: Random): SmoothStepInjective;
}
declare interface MonoNoiseData {
    seed: number;
    resolution: number;
    roughness: number;
    strength: number;
}
export declare class MonoNoiseInjective extends Injective<MonoNoiseData> {
    static monotoneRandom(random: Random, n: number, roughness: number, strength: number): Float32Array;
    readonly seed: ObservableValue<number>;
    readonly resolution: ObservableValue<number>;
    readonly roughness: ObservableValue<number>;
    readonly strength: ObservableValue<number>;
    private values;
    constructor();
    fx(y: number): number;
    fy(x: number): number;
    deserialize(format: InjectiveFormat<MonoNoiseData>): MonoNoiseInjective;
    serialize(): InjectiveFormat<MonoNoiseData>;
    copy(): MonoNoiseInjective;
    randomize(random: Random): MonoNoiseInjective;
    private update;
}
export {};
