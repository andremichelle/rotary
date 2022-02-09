import {Observable, ObservableImpl, Observer, Terminable} from "../lib/common.js"

export enum TransportMessageType {
    Play, Pause, Move
}

export type TransportMessage =
    | { type: TransportMessageType.Play }
    | { type: TransportMessageType.Pause }
    | { type: TransportMessageType.Move, position: number };

export interface TransportListener {
    listenToTransport(transport: Transport): Terminable
}

export class Transport implements Observable<TransportMessage> {
    private readonly observable: ObservableImpl<TransportMessage> = new ObservableImpl<TransportMessage>()

    private moving: boolean = false

    constructor() {
    }

    addObserver(observer: Observer<TransportMessage>, notify: boolean): Terminable {
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<TransportMessage>): boolean {
        return this.observable.removeObserver(observer)
    }

    play(): void {
        if (this.moving) return
        this.moving = true
        this.observable.notify({type: TransportMessageType.Play})
    }

    pause(): void {
        if (!this.moving) return
        this.moving = false
        this.observable.notify({type: TransportMessageType.Pause})
    }

    togglePlayback(): void {
        if (this.moving) {
            this.pause()
        } else {
            this.play()
        }
    }

    stop(): void {
        this.pause()
        this.move(0.0)
    }

    move(position: number): void {
        this.observable.notify({type: TransportMessageType.Move, position: position})
    }

    terminate(): void {
        this.observable.terminate()
    }
}