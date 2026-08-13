/**
 * ClientRouter re-executes inline module scripts on every soft navigation.
 * Register window listeners only the first time a boot id runs.
 */
export function bootOnce(id: string): boolean {
    const store = (window.__scriptBoot ??= {});
    if (store[id]) return false;
    store[id] = true;
    return true;
}
