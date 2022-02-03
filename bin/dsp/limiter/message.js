export class SetLookahead {
    constructor(seconds) {
        this.seconds = seconds;
        this.type = 'lookahead';
    }
}
export class SetThreshold {
    constructor(db) {
        this.db = db;
        this.type = 'threshold';
    }
}
//# sourceMappingURL=message.js.map