export type WorkletType<T extends AudioWorkletNode> = { new(context: BaseAudioContext, _?): T }

export interface WorkletFactory<T extends AudioWorkletNode> {
    create(): T
}

export class WorkletModules {
    private static FILES: Map<WorkletType<any>, string> = new Map<WorkletType<any>, string>()
    private static CACHE: WeakMap<BaseAudioContext, Map<WorkletType<any>, Promise<void>>> = new WeakMap<BaseAudioContext, Map<WorkletType<any>, Promise<void>>>()

    static register(type: WorkletType<any>, path: string): void {
        console.assert(!WorkletModules.FILES.has(type))
        WorkletModules.FILES.set(type, path)
    }

    static async create<T extends AudioWorkletNode>(context: BaseAudioContext, type: WorkletType<T>, factory?: WorkletFactory<T>): Promise<T> {
        let cache = WorkletModules.CACHE.get(context)
        if (cache === undefined) {
            cache = new Map<WorkletType<any>, Promise<void>>()
            WorkletModules.CACHE.set(context, cache)
        }
        let promise = cache.get(type)
        if (promise === undefined) {
            console.assert(WorkletModules.FILES.has(type))
            const moduleURL = WorkletModules.FILES.get(type)
            console.debug(`cache missed. loading ${moduleURL}...`)
            promise = context.audioWorklet.addModule(moduleURL)
            cache.set(type, promise)
        }
        await promise
        return undefined === factory ? new type(context) : factory.create()
    }
}