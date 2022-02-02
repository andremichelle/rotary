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
export class FormatUpdatedMessage {
    constructor(version) {
        this.version = version;
        this.type = 'format-updated';
    }
}
//# sourceMappingURL=messages-to-worklet.js.map