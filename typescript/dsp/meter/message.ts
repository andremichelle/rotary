export class UpdateMeter {
    readonly type = 'loop-duration'

    constructor(readonly seconds: number) {
    }
}