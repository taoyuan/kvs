export interface Adapter<V> {
  readonly name: string;
  has(key: string): Promise<number>;
  get(key: string): Promise<V>;
  set(key: string, value: V): Promise<void>;
  getset(key: string, value: V): Promise<V>;
  getdel(key: string): Promise<V>;
  del(key: string): Promise<number>;
  keys(pattern?: string): Promise<string[]>;
  clear(pattern?: string): Promise<number>;
  close(): Promise<void>;
}

export interface AdapterInitializer {
  initialize(settings?): Promise<AdapterFactory<any>>;
}

export interface AdapterFactory<V> {
  readonly name: string;
  create(options?: {[name: string]: any}): Adapter<V>;
  close(): Promise<void>;
}

export abstract class AbstractAdapter<V> implements Adapter<V> {
  protected constructor(public readonly name: string) {

  }

  abstract async has(key: string): Promise<number>;
  abstract async get(key: string): Promise<V>;
  abstract async set(key: string, value: V): Promise<void>;
  abstract async getset(key: string, value: V): Promise<V>;
  abstract async getdel(key: string): Promise<V>;
  abstract async del(key: string): Promise<number>;
  abstract async keys(pattern?: string): Promise<string[]>;
  abstract async clear(pattern?: string): Promise<number>;
  abstract async close(): Promise<void>
}
