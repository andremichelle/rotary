import { ObservableImpl } from "../lib/common.js";
export class Transport {
    constructor() {
        this.observable = new ObservableImpl();
        this.moving = false;
    }
    addObserver(observer, notify) {
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    play() {
        if (this.moving)
            return;
        this.moving = true;
        this.observable.notify({ type: "transport-play" });
    }
    pause() {
        if (!this.moving)
            return;
        this.moving = false;
        this.observable.notify({ type: "transport-pause" });
    }
    togglePlayback() {
        if (this.moving) {
            this.pause();
        }
        else {
            this.play();
        }
    }
    stop() {
        this.pause();
        this.move(0.0);
    }
    move(position) {
        this.observable.notify({ type: "transport-move", position: position });
    }
    terminate() {
        this.observable.terminate();
    }
}
//# sourceMappingURL=sequencing.js.map