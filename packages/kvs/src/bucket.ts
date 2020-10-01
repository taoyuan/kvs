import {Adapter} from './types';

export type Loader = (query?: string) => any;

export interface BucketOptions {
  ttl?: number;
  stale?: boolean;
  delimiter?: string;
  load?: Loader;
}

export class Bucket<T = Record<string, any>> {
  namespace: string;
  adapter: Adapter;
  protected ttl: number;
  protected load?: Loader;
  protected allowStale: boolean;
  protected delimiter: string;

  constructor(
    namespace: string,
    adapter: Adapter,
    options: BucketOptions = {},
  ) {
    this.namespace = namespace;
    this.adapter = adapter;

    this.ttl = options.ttl ?? 0;
    this.load = options.load;
    this.allowStale = !!options.stale;
    this.delimiter = options.delimiter ?? ':';
  }

  fullkey<K extends keyof T>(key: K): string {
    if (!this.namespace) {
      return key as string;
    }
    return this.namespace + this.delimiter + key;
  }

  async has<K extends keyof T>(key: K) {
    return this.adapter.has(this.fullkey(key));
  }

  async exists<K extends keyof T>(key: K) {
    return this.adapter.has(this.fullkey(key));
  }

  async get<K extends keyof T>(key: K, query?: any): Promise<T[K]> {
    const fullkey = this.fullkey(key);
    let value = await this.adapter.get(fullkey);

    if (!this.load) {
      return value;
    }

    const exists = await this.adapter.has(fullkey);
    if (value != null && (exists || this.allowStale)) {
      return value;
    }

    value = await this.load(query);

    if (value === undefined) {
      return value;
    }

    await this.adapter.set(fullkey, value, this.ttl);
    return value;
  }

  async set<K extends keyof T>(
    key: K,
    value: T[K],
    ttl?: number,
  ): Promise<void> {
    return this.adapter.set(this.fullkey(key), value, ttl ?? this.ttl);
  }

  async getset<K extends keyof T>(
    key: K,
    value: T[K],
  ): Promise<T[K] | undefined> {
    return this.adapter.getset(this.fullkey(key), value);
  }

  async getdel<K extends keyof T>(key: K): Promise<T[K] | undefined> {
    return this.adapter.getdel(this.fullkey(key));
  }

  async del<K extends keyof T>(key: K): Promise<number> {
    return this.adapter.del(this.fullkey(key));
  }

  async keys<K extends keyof T>(pattern?: string): Promise<K[]> {
    pattern = pattern ?? '*';
    const len = this.namespace.length + 1;
    const keys = await this.adapter.keys(this.namespace + ':' + pattern);
    if (!keys) {
      return [];
    }
    for (let i = 0, l = keys.length; i < l; i++) {
      keys[i] = keys[i].substr(len);
    }
    return <K[]>(keys as unknown);
  }

  async clear(pattern?: string): Promise<number> {
    const patternToUse = pattern ?? '*';
    return this.adapter.clear(this.namespace + ':' + patternToUse);
  }
}
