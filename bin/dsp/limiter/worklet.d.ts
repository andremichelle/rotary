export declare class LimiterWorklet extends AudioWorkletNode {
    static build(context: BaseAudioContext): Promise<LimiterWorklet>;
    private $lookahead;
    private $threshold;
    constructor(context: any);
    lookahead: any;
    threshold: any;
}
