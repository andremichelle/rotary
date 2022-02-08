export class RewindMessage {
    constructor() {
        this.type = 'rewind';
    }
}
export class TransportMessage {
    constructor(moving) {
        this.moving = moving;
        this.type = 'transport';
    }
}
//# sourceMappingURL=messages.js.map