import {Store, StoreOptions} from './store';
import { AdapterInitializer } from "./adapter";

export * from './store';
export * from "./adapter";
export * from "./bucket";

export async function store(name: string, settings?: StoreOptions): Promise<Store>;
export async function store(settings: StoreOptions): Promise<Store>;
export async function store(initializer: AdapterInitializer): Promise<Store>;
export async function store(name: string | StoreOptions | AdapterInitializer, settings?: StoreOptions): Promise<Store> {
  const store = new Store(name, settings);
  await store.ready();
  return store;
}
