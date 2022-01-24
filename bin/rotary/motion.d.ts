import { Observable, ObservableImpl, ObservableValue, Observer, Serializer, Terminable, Terminator } from "../lib/common.js";
import { Random } from "../lib/math.js";
declare type Data = PowData | CShapeData | TShapeData | SmoothStepData;
export declare type MotionType = {
    new (): Motion<any>;
};
export declare interface MotionFormat<DATA extends Data> {
    class: string;
    data: DATA;
}
export declare abstract class Motion<DATA extends Data> implements Observable<Motion<DATA>>, Serializer<MotionFormat<DATA>>, Terminable {
    static from(format: MotionFormat<any>): Motion<any>;
    static random(random: Random): Motion<any>;
    protected readonly terminator: Terminator;
    protected readonly observable: ObservableImpl<Motion<DATA>>;
    abstract map(x: number): number;
    abstract inverse(x: number): number;
    abstract deserialize(format: MotionFormat<DATA>): Motion<DATA>;
    abstract serialize(): MotionFormat<DATA>;
    abstract copy(): Motion<DATA>;
    abstract randomize(random: Random): Motion<DATA>;
    addObserver(observer: Observer<Motion<DATA>>): Terminable;
    removeObserver(observer: Observer<Motion<DATA>>): boolean;
    pack(data?: DATA): MotionFormat<DATA>;
    unpack(format: MotionFormat<DATA>): DATA;
    bindValue(property: ObservableValue<any>): ObservableValue<any>;
    terminate(): void;
}
export declare class LinearMotion extends Motion<never> {
    map(x: number): number;
    inverse(x: number): number;
    serialize(): MotionFormat<never>;
    deserialize(format: MotionFormat<never>): LinearMotion;
    copy(): LinearMotion;
    randomize(random: Random): Motion<never>;
}
declare interface PowData {
    exponent: number;
}
export declare class PowMotion extends Motion<PowData> {
    private readonly range;
    readonly exponent: ObservableValue<any>;
    map(x: number): number;
    inverse(x: number): number;
    serialize(): MotionFormat<PowData>;
    deserialize(format: MotionFormat<PowData>): PowMotion;
    copy(): PowMotion;
    randomize(random: Random): Motion<PowData>;
}
declare interface CShapeData {
    slope: number;
}
export declare class CShapeMotion extends Motion<CShapeData> {
    private readonly range;
    readonly slope: ObservableValue<any>;
    private o;
    private c;
    constructor();
    map(x: number): number;
    inverse(x: number): number;
    serialize(): MotionFormat<CShapeData>;
    deserialize(format: MotionFormat<CShapeData>): CShapeMotion;
    copy(): CShapeMotion;
    randomize(random: Random): Motion<CShapeData>;
    private update;
}
declare interface TShapeData {
    shape: number;
}
export declare class TShapeMotion extends Motion<TShapeData> {
    private readonly range;
    readonly shape: ObservableValue<any>;
    constructor();
    map(x: number): number;
    inverse(x: number): number;
    serialize(): MotionFormat<TShapeData>;
    deserialize(format: MotionFormat<TShapeData>): TShapeMotion;
    copy(): TShapeMotion;
    randomize(random: Random): Motion<TShapeData>;
}
declare interface SmoothStepData {
    edge0: number;
    edge1: number;
}
export declare class SmoothStepMotion extends Motion<SmoothStepData> {
    readonly edge0: ObservableValue<any>;
    readonly edge1: ObservableValue<any>;
    constructor();
    map(x: number): number;
    inverse(y: number): number;
    deserialize(format: MotionFormat<SmoothStepData>): SmoothStepMotion;
    serialize(): MotionFormat<SmoothStepData>;
    copy(): SmoothStepMotion;
    randomize(random: Random): Motion<SmoothStepData>;
}
export {};
