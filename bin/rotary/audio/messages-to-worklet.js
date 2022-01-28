export class UpdateCursorMessage {
    constructor(phase) {
        this.phase = phase;
        this.type = 'phase';
    }
}
export class TransportMessage {
    constructor(moving) {
        this.moving = moving;
        this.type = 'transport';
    }
}
//# sourceMappingURL=messages-to-worklet.js.map