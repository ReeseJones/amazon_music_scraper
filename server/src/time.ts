export function delay<T>(timeMs: number, resolveValue?: T): Promise<T|undefined> {
    return new Promise(resolve => setTimeout(resolve, timeMs, resolveValue));
 }