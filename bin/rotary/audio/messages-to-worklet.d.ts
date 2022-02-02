export declare type MessageToWorklet = UpdateCursorMessage | TransportMessage | FormatUpdatedMessage;
export declare class UpdateCursorMessage {
    readonly phase: number;
    readonly type = "phase";
    constructor(phase: number);
}
export declare class TransportMessage {
    readonly moving: boolean;
    readonly type = "transport";
    constructor(moving: boolean);
}
export declare class FormatUpdatedMessage {
    readonly version: number;
    readonly type = "format-updated";
    constructor(version: number);
}
