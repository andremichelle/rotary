export declare type WorkletType<T extends AudioWorkletNode> = {
    new (context: BaseAudioContext): T;
};
export declare class WorkletModules {
    private static FILES;
    private static CACHE;
    static register(type: WorkletType<any>, path: string): void;
    static create<T extends AudioWorkletNode>(context: BaseAudioContext, type: WorkletType<T>): Promise<T>;
}
