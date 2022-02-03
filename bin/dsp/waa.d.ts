export declare type WorkletType<T extends AudioWorkletNode> = {
    new (context: BaseAudioContext, _?: any): T;
};
export interface WorkletFactory<T extends AudioWorkletNode> {
    create(): T;
}
export declare class WorkletModules {
    private static FILES;
    private static CACHE;
    static register(type: WorkletType<any>, path: string): void;
    static create<T extends AudioWorkletNode>(context: BaseAudioContext, type: WorkletType<T>, factory?: WorkletFactory<T>): Promise<T>;
}
