import {Observable, ObservableImpl, Observer, Terminable} from "../lib/common.js"

export type TransportMessage =
    | { type: "transport-play" }
    | { type: "transport-pause" }
    | { type: "transport-move", position: number }

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
        this.observable.notify({type: "transport-play"})
    }

    pause(): void {
        if (!this.moving) return
        this.moving = false
        this.observable.notify({type: "transport-pause"})
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
        this.observable.notify({type: "transport-move", position: position})
    }

    terminate(): void {
        this.observable.terminate()
    }
}