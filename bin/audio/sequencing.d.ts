import { Observable, Observer, Terminable } from "../lib/common.js";
export declare type TransportMessageType = "transport-play" | "transport-pause" | "transport-move";
export declare type TransportMessage = {
    type: "transport-play";
} | {
    type: "transport-pause";
} | {
    type: "transport-move";
    position: number;
};
export interface TransportListener {
    listenToTransport(transport: Transport): Terminable;
}
export declare class Transport implements Observable<TransportMessage> {
    private readonly observable;
    private moving;
    constructor();
    addObserver(observer: Observer<TransportMessage>, notify: boolean): Terminable;
    removeObserver(observer: Observer<TransportMessage>): boolean;
    play(): void;
    pause(): void;
    togglePlayback(): void;
    stop(): void;
    move(position: number): void;
    terminate(): void;
}
