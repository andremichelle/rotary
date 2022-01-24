import { Observable, ObservableImpl, ObservableValue, Observer, Serializer, Terminable, Terminator } from "./common.js";
import { Random } from "./math.js";
declare type Data = PowData | CShapeData | TShapeData | SmoothStepData;
export declare type InjectiveType = {
    new (): Injective<any>;
};
export declare interface InjectiveFormat<DATA extends Data> {
    class: string;
    data: DATA;
}
export declare abstract class Injective<DATA extends Data> implements Observable<Injective<DATA>>, Serializer<InjectiveFormat<DATA>>, Terminable {
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
    bindValue(property: ObservableValue<any>): ObservableValue<any>;
    terminate(): void;
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
    readonly exponent: ObservableValue<any>;
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
    readonly slope: ObservableValue<any>;
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
    readonly shape: ObservableValue<any>;
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
    readonly edge0: ObservableValue<any>;
    readonly edge1: ObservableValue<any>;
    constructor();
    fx(x: number): number;
    fy(y: number): number;
    deserialize(format: InjectiveFormat<SmoothStepData>): SmoothStepInjective;
    serialize(): InjectiveFormat<SmoothStepData>;
    copy(): SmoothStepInjective;
    randomize(random: Random): SmoothStepInjective;
}
export {};
