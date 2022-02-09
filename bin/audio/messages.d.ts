export declare class RewindMessage {
    readonly type = "rewind";
    constructor();
}
export declare class TransportMessage {
    readonly moving: boolean;
    readonly type = "transport";
    constructor(moving: boolean);
}
