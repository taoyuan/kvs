import { Store, StoreOptions } from "./store";
import { AdapterInitializer } from "./adapter";

export * from "./store";
export * from "./adapter";
export * from "./bucket";

export function store(name: string, settings?: StoreOptions): Store;
export function store(settings: StoreOptions): Store;
export function store(initializer: AdapterInitializer): Store;
export function store(name: string | StoreOptions | AdapterInitializer, settings?: StoreOptions): Store {
  return new Store(name, settings);
}
