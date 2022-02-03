var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class WorkletModules {
    static register(type, path) {
        console.assert(!WorkletModules.FILES.has(type));
        WorkletModules.FILES.set(type, path);
    }
    static create(context, type, factory) {
        return __awaiter(this, void 0, void 0, function* () {
            let cache = WorkletModules.CACHE.get(context);
            if (cache === undefined) {
                cache = new Map();
                WorkletModules.CACHE.set(context, cache);
            }
            let promise = cache.get(type);
            if (promise === undefined) {
                console.assert(WorkletModules.FILES.has(type));
                const moduleURL = WorkletModules.FILES.get(type);
                console.debug(`cache missed. loading ${moduleURL}...`);
                promise = context.audioWorklet.addModule(moduleURL);
                cache.set(type, promise);
            }
            yield promise;
            return undefined === factory ? new type(context) : factory.create();
        });
    }
}
WorkletModules.FILES = new Map();
WorkletModules.CACHE = new WeakMap();
//# sourceMappingURL=waa.js.map