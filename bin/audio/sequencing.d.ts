import { Observable, Observer, Terminable } from "../lib/common.js";
export declare enum TransportMessageType {
    Play = 0,
    Pause = 1,
    Move = 2
}
export declare type TransportMessage = {
    type: TransportMessageType.Play;
} | {
    type: TransportMessageType.Pause;
} | {
    type: TransportMessageType.Move;
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
