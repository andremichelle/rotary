export declare type Message = SetLookahead | SetThreshold;
export declare class SetLookahead {
    readonly seconds: number;
    readonly type = "lookahead";
    constructor(seconds: number);
}
export declare class SetThreshold {
    readonly db: number;
    readonly type = "threshold";
    constructor(db: number);
}
